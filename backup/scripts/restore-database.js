#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// List available backups
async function listBackups() {
  const dataDir = path.join(__dirname, '../data');
  try {
    const files = await fs.readdir(dataDir);
    const backups = files
      .filter(f => f.startsWith('backup_'))
      .sort()
      .reverse();
    
    return backups;
  } catch (err) {
    console.error('Error listing backups:', err.message);
    return [];
  }
}

// Read backup metadata
async function readMetadata(backupDir) {
  try {
    const metadataPath = path.join(backupDir, 'metadata.json');
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading metadata:', err.message);
    return null;
  }
}

// Restore data to a table
async function restoreTable(tableName, data) {
  console.log(`📤 Restoring ${tableName}...`);
  
  if (!data || data.length === 0) {
    console.log(`   No data to restore for ${tableName}`);
    return { success: true, count: 0 };
  }

  try {
    // Delete existing data (be careful!)
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.warn(`   Warning: Could not clear ${tableName}: ${deleteError.message}`);
    }

    // Insert data in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);

      if (insertError) {
        console.error(`   Error inserting batch: ${insertError.message}`);
        return { success: false, count: inserted, error: insertError.message };
      }

      inserted += batch.length;
      console.log(`   Restored ${inserted}/${data.length} records...`);
    }

    console.log(`✅ Restored ${inserted} records to ${tableName}`);
    return { success: true, count: inserted };
    
  } catch (err) {
    console.error(`❌ Error restoring ${tableName}: ${err.message}`);
    return { success: false, count: 0, error: err.message };
  }
}

// Main restore function
async function performRestore() {
  console.log('🔄 Hospital CRM Database Restore Tool\n');

  try {
    // List available backups
    const backups = await listBackups();
    
    if (backups.length === 0) {
      console.log('❌ No backups found');
      return { success: false };
    }

    console.log('Available backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup}`);
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

    const backupDir = path.join(__dirname, '../data', selectedBackup);
    
    // Read metadata
    const metadata = await readMetadata(backupDir);
    if (!metadata) {
      console.log('❌ Could not read backup metadata');
      return { success: false };
    }

    console.log(`\n📋 Backup Information:`);
    console.log(`   Date: ${new Date(metadata.date).toLocaleString()}`);
    console.log(`   Total Records: ${metadata.totalRecords}`);
    console.log(`   Tables: ${Object.keys(metadata.tables).length}`);

    // Confirm restore
    const confirm = await askQuestion('\n⚠️  WARNING: This will REPLACE all existing data! Continue? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      return { success: false };
    }

    console.log('\n🚀 Starting restore...\n');

    const restoreResults = {};

    // Restore each table
    for (const [tableName, backupInfo] of Object.entries(metadata.tables)) {
      if (backupInfo.success) {
        try {
          const dataPath = path.join(backupDir, `${tableName}.json`);
          const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
          const result = await restoreTable(tableName, data);
          restoreResults[tableName] = result;
        } catch (err) {
          console.error(`❌ Error loading ${tableName}: ${err.message}`);
          restoreResults[tableName] = { success: false, count: 0, error: err.message };
        }
      }
    }

    // Summary
    console.log('\n📊 Restore Summary:');
    let totalRestored = 0;
    let failedTables = 0;

    for (const [table, result] of Object.entries(restoreResults)) {
      if (result.success) {
        console.log(`   ✅ ${table}: ${result.count} records`);
        totalRestored += result.count;
      } else {
        console.log(`   ❌ ${table}: Failed - ${result.error}`);
        failedTables++;
      }
    }

    console.log(`\n✨ Restore completed!`);
    console.log(`   Total records restored: ${totalRestored}`);
    if (failedTables > 0) {
      console.log(`   ⚠️  Failed tables: ${failedTables}`);
    }

    return { success: true, totalRestored, failedTables };

  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    rl.close();
  }
}

// Run restore if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performRestore()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { performRestore };