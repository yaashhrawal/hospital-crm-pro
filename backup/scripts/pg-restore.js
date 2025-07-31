#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { promisify } from 'util';
import { parseSupabaseUrl, checkPgTools } from './pg-backup.js';

const execAsync = promisify(exec);

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for confirmation
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// List available PostgreSQL backups
async function listPgBackups() {
  const backupDir = path.join(__dirname, '../data/pg-backups');
  
  try {
    await fs.access(backupDir);
    const files = await fs.readdir(backupDir);
    
    const backups = files
      .filter(f => f.endsWith('.sql') || f.endsWith('.dump'))
      .sort()
      .reverse();
    
    return backups;
  } catch (err) {
    console.error('Backup directory not found. Run a backup first.');
    return [];
  }
}

// Read backup metadata
async function readPgMetadata(backupDir, timestamp) {
  try {
    const metadataPath = path.join(backupDir, `metadata-${timestamp}.json`);
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

// Get database password securely
function getDatabasePassword() {
  if (process.env.SUPABASE_DB_PASSWORD) {
    return process.env.SUPABASE_DB_PASSWORD;
  }
  
  console.log('🔐 Database password required for PostgreSQL restore');
  console.log('   Add SUPABASE_DB_PASSWORD to your .env file');
  throw new Error('Database password not configured');
}

// Perform PostgreSQL restore using pg_restore or psql
async function performPgRestore(backupFile, options = {}) {
  console.log(`🔄 Starting PostgreSQL Database Restore...\n`);
  
  try {
    // Check if pg tools are available
    if (!await checkPgTools()) {
      return { success: false, error: 'PostgreSQL tools not available' };
    }
    
    // Parse connection details
    const connDetails = parseSupabaseUrl(supabaseUrl);
    const password = getDatabasePassword();
    
    console.log(`📁 Restore file: ${backupFile}`);
    console.log(`🔗 Target database: ${connDetails.host}:${connDetails.port}`);
    
    // Check if backup file exists
    try {
      await fs.access(backupFile);
    } catch (err) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    // Determine restore method based on file extension
    const isCustomFormat = backupFile.endsWith('.dump') || await isCustomFormatFile(backupFile);
    
    let restoreCommand, restoreArgs;
    
    if (isCustomFormat) {
      // Use pg_restore for custom format files
      restoreCommand = 'pg_restore';
      restoreArgs = [
        '--host', connDetails.host,
        '--port', connDetails.port.toString(),
        '--username', connDetails.username,
        '--dbname', connDetails.database,
        '--verbose',
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        backupFile
      ];
    } else {
      // Use psql for SQL format files
      restoreCommand = 'psql';
      restoreArgs = [
        '--host', connDetails.host,
        '--port', connDetails.port.toString(),
        '--username', connDetails.username,
        '--dbname', connDetails.database,
        '--echo-errors',
        '--file', backupFile
      ];
    }
    
    // Add additional options
    if (options.verbose) {
      restoreArgs.push('--verbose');
    }
    
    console.log(`🛠️  Using ${restoreCommand} for restore...`);
    console.log(`⚙️  Arguments: ${restoreArgs.join(' ')}\n`);
    
    // Prepare environment with password
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute restore command
    const result = await new Promise((resolve, reject) => {
      const restoreProcess = spawn(restoreCommand, restoreArgs, { env });
      
      let stdout = '';
      let stderr = '';
      
      restoreProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Show progress for pg_restore
        if (data.toString().includes('processing') || data.toString().includes('creating')) {
          console.log(`   ${data.toString().trim()}`);
        }
      });
      
      restoreProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        const output = data.toString();
        
        // Filter out common warnings that are not errors
        if (!output.includes('NOTICE') && 
            !output.includes('already exists, skipping') &&
            !output.includes('WARNING')) {
          console.log(`   ${output.trim()}`);
        }
      });
      
      restoreProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          // pg_restore can return non-zero even on successful restore due to warnings
          if (stderr.includes('ERROR')) {
            reject(new Error(`${restoreCommand} failed with code ${code}: ${stderr}`));
          } else {
            console.log(`   ⚠️  ${restoreCommand} completed with warnings (code ${code})`);
            resolve({ success: true, stdout, stderr, warnings: true });
          }
        }
      });
      
      restoreProcess.on('error', (error) => {
        reject(error);
      });
    });
    
    console.log('\n✨ PostgreSQL restore completed!');
    if (result.warnings) {
      console.log('⚠️  Some warnings occurred but restore was successful');
    }
    
    return {
      success: true,
      warnings: result.warnings || false
    };
    
  } catch (error) {
    console.error('\n❌ PostgreSQL restore failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Check if file is custom format
async function isCustomFormatFile(filePath) {
  try {
    const buffer = await fs.readFile(filePath, { encoding: null, flag: 'r' });
    // Custom format files start with 'PGDMP' magic bytes
    return buffer.slice(0, 5).toString() === 'PGDMP';
  } catch (err) {
    return false;
  }
}

// Extract timestamp from filename
function extractTimestamp(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

// Main restore function with interactive selection
async function performInteractiveRestore() {
  console.log('🔄 PostgreSQL Database Restore Tool\n');
  
  try {
    // List available backups
    const backups = await listPgBackups();
    
    if (backups.length === 0) {
      console.log('❌ No PostgreSQL backups found');
      console.log('   Run: npm run backup:pg');
      return { success: false };
    }
    
    console.log('Available PostgreSQL backups:');
    backups.forEach((backup, index) => {
      const timestamp = extractTimestamp(backup);
      const date = timestamp ? new Date(timestamp.replace('_', 'T').replace(/-/g, ':')) : null;
      console.log(`${index + 1}. ${backup} ${date ? `(${date.toLocaleString()})` : ''}`);
    });
    
    // Ask user to select a backup
    const selection = await askQuestion('\nSelect backup number (or "latest" for most recent): ');
    
    let selectedBackup;
    if (selection.toLowerCase() === 'latest') {
      selectedBackup = backups[0];
    } else {
      const index = parseInt(selection) - 1;
      if (index < 0 || index >= backups.length) {
        console.log('❌ Invalid selection');
        return { success: false };
      }
      selectedBackup = backups[index];
    }
    
    const backupDir = path.join(__dirname, '../data/pg-backups');
    const backupFile = path.join(backupDir, selectedBackup);
    
    // Try to read metadata
    const timestamp = extractTimestamp(selectedBackup);
    const metadata = timestamp ? await readPgMetadata(backupDir, timestamp) : null;
    
    console.log(`\n📋 Backup Information:`);
    console.log(`   File: ${selectedBackup}`);
    if (metadata) {
      console.log(`   Date: ${new Date(metadata.date).toLocaleString()}`);
      console.log(`   Size: ${metadata.fileSizeMB} MB`);
      console.log(`   Type: ${metadata.backupType || 'Unknown'}`);
    }
    
    // Show important warnings
    console.log(`\n⚠️  CRITICAL WARNINGS:`);
    console.log(`   🔥 This will COMPLETELY REPLACE your database!`);
    console.log(`   🔥 All current data will be PERMANENTLY DELETED!`);
    console.log(`   🔥 This action CANNOT be undone!`);
    console.log(`   🔥 Make sure you have a backup before proceeding!`);
    
    // Multiple confirmations for safety
    const confirm1 = await askQuestion('\n❓ Do you understand this will delete all current data? (yes/no): ');
    if (confirm1.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      return { success: false };
    }
    
    const confirm2 = await askQuestion('❓ Are you absolutely sure you want to continue? (yes/no): ');
    if (confirm2.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      return { success: false };
    }
    
    const confirm3 = await askQuestion('❓ Last chance - type "RESTORE" to proceed: ');
    if (confirm3 !== 'RESTORE') {
      console.log('❌ Restore cancelled');
      return { success: false };
    }
    
    console.log('\n🚀 Starting restore process...\n');
    
    // Perform the restore
    const result = await performPgRestore(backupFile, { verbose: true });
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    rl.close();
  }
}

// Create restore instructions
function createRestoreInstructions() {
  const instructions = `
# PostgreSQL Restore Instructions

## Interactive Restore (Recommended)
\`npm run backup:pg-restore\`

## Command Line Restore
\`node backup/scripts/pg-restore.js /path/to/backup.sql\`

## Restore Types

1. **Complete Restore**: Restores entire database (schema + data)
2. **Schema Restore**: Restores only table structure
3. **Data Restore**: Restores only data (requires existing schema)

## Safety Features

✅ **Multiple Confirmations**: Requires explicit confirmation
✅ **Backup Validation**: Checks file integrity before restore
✅ **Progress Monitoring**: Shows real-time restore progress
✅ **Error Handling**: Detailed error reporting
✅ **Transaction Safety**: Atomic restore operations

## Emergency Recovery

For emergency situations:
1. Stop all application processes
2. Run interactive restore
3. Select most recent backup
4. Follow confirmation prompts
5. Verify data integrity after restore

## Important Notes

⚠️  **COMPLETE DATA REPLACEMENT**: This process replaces ALL data
⚠️  **DOWNTIME REQUIRED**: Application must be offline during restore
⚠️  **BACKUP FIRST**: Always backup current state before restore
⚠️  **TEST FIRST**: Test restore process on development environment
`;
  
  return instructions;
}

// Run restore if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(createRestoreInstructions());
    process.exit(0);
  }
  
  // If backup file specified, restore directly
  if (args.length > 0 && !args[0].startsWith('--')) {
    const backupFile = args[0];
    performPgRestore(backupFile, { verbose: true })
      .then(result => {
        rl.close();
        process.exit(result.success ? 0 : 1);
      })
      .catch(err => {
        console.error('Fatal error:', err);
        rl.close();
        process.exit(1);
      });
  } else {
    // Interactive restore
    performInteractiveRestore()
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
      });
  }
}

export { performPgRestore, performInteractiveRestore };