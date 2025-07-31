#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Parse Supabase URL to get connection details
function parseSupabaseUrl(url) {
  if (!url) {
    throw new Error('Supabase URL not provided');
  }
  
  // Extract project reference from URL
  // Format: https://projectref.supabase.co
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Invalid Supabase URL format');
  }
  
  const projectRef = match[1];
  
  return {
    host: 'db.' + projectRef + '.supabase.co',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    // Password needs to be set separately
    projectRef
  };
}

// Check if PostgreSQL tools are available
async function checkPgTools() {
  try {
    await execAsync('pg_dump --version');
    await execAsync('pg_restore --version');
    console.log('✅ PostgreSQL tools found');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL tools not found. Please install PostgreSQL:');
    console.error('   macOS: brew install postgresql');
    console.error('   Ubuntu: sudo apt-get install postgresql-client');
    console.error('   Windows: Download from https://www.postgresql.org/download/');
    return false;
  }
}

// Create backup directory with timestamp
async function createBackupDirectory() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupDir = path.join(__dirname, '../data/pg-backups');
  await fs.mkdir(backupDir, { recursive: true });
  return { backupDir, timestamp };
}

// Get database password securely
function getDatabasePassword() {
  // Check environment variables first
  if (process.env.SUPABASE_DB_PASSWORD) {
    return process.env.SUPABASE_DB_PASSWORD;
  }
  
  // If not in env, user needs to provide it
  console.log('🔐 Database password required for PostgreSQL backup');
  console.log('   Add SUPABASE_DB_PASSWORD to your .env file, or');
  console.log('   Find it in Supabase Dashboard → Settings → Database → Connection string');
  throw new Error('Database password not configured');
}

// Perform PostgreSQL backup using pg_dump
async function performPgBackup(options = {}) {
  console.log('🚀 Starting PostgreSQL Database Backup...\n');
  
  try {
    // Check if pg tools are available
    if (!await checkPgTools()) {
      return { success: false, error: 'PostgreSQL tools not available' };
    }
    
    // Parse connection details
    const connDetails = parseSupabaseUrl(supabaseUrl);
    const password = getDatabasePassword();
    
    // Create backup directory
    const { backupDir, timestamp } = await createBackupDirectory();
    
    console.log(`📁 Backup directory: ${backupDir}`);
    console.log(`🔗 Connecting to: ${connDetails.host}:${connDetails.port}`);
    
    // Backup options
    const backupTypes = {
      // Complete database dump (structure + data)
      complete: {
        filename: `complete-backup-${timestamp}.sql`,
        description: 'Complete database backup (schema + data)',
        args: [
          '--host', connDetails.host,
          '--port', connDetails.port.toString(),
          '--username', connDetails.username,
          '--dbname', connDetails.database,
          '--verbose',
          '--clean',
          '--if-exists',
          '--create',
          '--format=custom',  // Custom format for better compression
          '--compress=6'      // Good compression level
        ]
      },
      
      // Schema only backup
      schema: {
        filename: `schema-backup-${timestamp}.sql`,
        description: 'Schema-only backup (structure only)',
        args: [
          '--host', connDetails.host,
          '--port', connDetails.port.toString(),
          '--username', connDetails.username,
          '--dbname', connDetails.database,
          '--verbose',
          '--schema-only',
          '--clean',
          '--if-exists',
          '--create'
        ]
      },
      
      // Data only backup
      data: {
        filename: `data-backup-${timestamp}.sql`,
        description: 'Data-only backup',
        args: [
          '--host', connDetails.host,
          '--port', connDetails.port.toString(),
          '--username', connDetails.username,
          '--dbname', connDetails.database,
          '--verbose',
          '--data-only',
          '--format=custom',
          '--compress=6'
        ]
      }
    };
    
    const backupType = options.type || 'complete';
    const backup = backupTypes[backupType];
    
    if (!backup) {
      throw new Error(`Invalid backup type: ${backupType}`);
    }
    
    const backupFile = path.join(backupDir, backup.filename);
    console.log(`📥 Creating ${backup.description}...`);
    console.log(`💾 Output file: ${backup.filename}\n`);
    
    // Prepare environment with password
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute pg_dump
    const result = await new Promise((resolve, reject) => {
      const args = [...backup.args, '--file', backupFile];
      const pgDump = spawn('pg_dump', args, { env });
      
      let stdout = '';
      let stderr = '';
      
      pgDump.stdout.on('data', (data) => {
        stdout += data.toString();
        // Show progress
        if (data.toString().includes('COPY')) {
          process.stdout.write('.');
        }
      });
      
      pgDump.stderr.on('data', (data) => {
        stderr += data.toString();
        // pg_dump sends verbose output to stderr
        if (data.toString().includes('reading') || data.toString().includes('dumping')) {
          console.log(`   ${data.toString().trim()}`);
        }
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
        }
      });
      
      pgDump.on('error', (error) => {
        reject(error);
      });
    });
    
    // Get backup file stats
    const stats = await fs.stat(backupFile);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    // Create metadata
    const metadata = {
      timestamp,
      date: new Date().toISOString(),
      backupType,
      filename: backup.filename,
      filePath: backupFile,
      fileSize: stats.size,
      fileSizeMB: sizeInMB,
      database: {
        host: connDetails.host,
        port: connDetails.port,
        database: connDetails.database,
        username: connDetails.username
      },
      pgDumpVersion: await getPgDumpVersion(),
      success: true
    };
    
    const metadataFile = path.join(backupDir, `metadata-${timestamp}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log('\n✨ PostgreSQL backup completed successfully!');
    console.log(`📍 Location: ${backupFile}`);
    console.log(`📊 Size: ${sizeInMB} MB`);
    console.log(`🕐 Duration: ${new Date().toISOString()}`);
    
    return {
      success: true,
      backupFile,
      metadata,
      sizeInMB
    };
    
  } catch (error) {
    console.error('\n❌ PostgreSQL backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Get pg_dump version
async function getPgDumpVersion() {
  try {
    const { stdout } = await execAsync('pg_dump --version');
    return stdout.trim();
  } catch (error) {
    return 'Unknown';
  }
}

// Create backup instructions
function createBackupInstructions() {
  const instructions = `
# PostgreSQL Backup Instructions

## Setup Database Password

Add your Supabase database password to your .env file:

\`\`\`
SUPABASE_DB_PASSWORD=your_database_password_here
\`\`\`

To find your password:
1. Go to Supabase Dashboard
2. Settings → Database 
3. Copy the password from the connection string

## Backup Types

1. **Complete Backup** (Recommended):
   \`npm run backup:pg\`
   - Includes schema + data
   - Best for full recovery

2. **Schema Only**:
   \`npm run backup:pg -- --type=schema\`
   - Structure only
   - Fast backup for development

3. **Data Only**:
   \`npm run backup:pg -- --type=data\`
   - Data without structure
   - For data migration

## Advantages of PostgreSQL Backup

✅ **Faster**: Native PostgreSQL tools are optimized
✅ **Smaller**: Better compression than JSON
✅ **Complete**: Includes constraints, indexes, triggers
✅ **Reliable**: Industry-standard backup method
✅ **Flexible**: Multiple backup formats supported
✅ **Transaction-safe**: Consistent point-in-time backup
`;
  
  return instructions;
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--type');
  const backupType = typeIndex !== -1 && args[typeIndex + 1] ? args[typeIndex + 1] : 'complete';
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(createBackupInstructions());
    process.exit(0);
  }
  
  performPgBackup({ type: backupType })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { performPgBackup, parseSupabaseUrl, checkPgTools };