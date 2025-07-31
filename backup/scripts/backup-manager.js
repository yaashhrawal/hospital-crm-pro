#!/usr/bin/env node

import readline from 'readline';
import { performBackup } from './backup-database.js';
import { performRestore } from './restore-database.js';
import { runScheduledBackup, cleanupOldBackups } from './schedule-backup.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display menu
function displayMenu() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════╗
║     Hospital CRM Backup Manager v1.0       ║
╚════════════════════════════════════════════╝

1. 📥 Create Backup Now
2. 📤 Restore from Backup
3. 📋 View Backup History
4. 🧹 Clean Old Backups
5. ⚙️  Setup Automated Backups
6. 📊 Check Database Status
7. ❌ Exit

`);
}

// Get user choice
function getChoice() {
  return new Promise((resolve) => {
    rl.question('Select an option (1-7): ', (answer) => {
      resolve(answer);
    });
  });
}

// View backup history
async function viewBackupHistory() {
  console.log('\n📋 Backup History:\n');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    const files = await fs.readdir(dataDir);
    const backups = files
      .filter(f => f.startsWith('backup_'))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      console.log('No backups found.');
      return;
    }
    
    for (const backup of backups) {
      const backupPath = path.join(dataDir, backup);
      const metadataPath = path.join(backupPath, 'metadata.json');
      
      try {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        const date = new Date(metadata.date).toLocaleString();
        const size = await getDirectorySize(backupPath);
        
        console.log(`📁 ${backup}`);
        console.log(`   Date: ${date}`);
        console.log(`   Records: ${metadata.totalRecords}`);
        console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      } catch (err) {
        console.log(`📁 ${backup} (metadata unavailable)`);
      }
    }
  } catch (err) {
    console.error('Error reading backup history:', err.message);
  }
}

// Get directory size
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

// Clean old backups interactively
async function cleanOldBackupsInteractive() {
  console.log('\n🧹 Cleaning old backups...\n');
  await cleanupOldBackups();
  
  console.log('\nPress Enter to continue...');
  await new Promise(resolve => rl.question('', resolve));
}

// Setup automated backups
async function setupAutomatedBackups() {
  console.log('\n⚙️  Automated Backup Setup\n');
  
  const setupScript = `
To set up automated backups, you need to add a cron job:

1. Open terminal and run: crontab -e

2. Add this line for daily backups at 2 AM:
   0 2 * * * cd ${__dirname} && /usr/bin/node schedule-backup.js daily

3. Save and exit

Alternative: Use PM2 for process management:
   npm install -g pm2
   pm2 start ${__dirname}/schedule-backup.js --cron "0 2 * * *"

For Windows, use Task Scheduler to run the backup script daily.
`;
  
  console.log(setupScript);
  
  console.log('\nPress Enter to continue...');
  await new Promise(resolve => rl.question('', resolve));
}

// Check database status
async function checkDatabaseStatus() {
  console.log('\n📊 Checking Database Status...\n');
  
  dotenv.config({ path: path.join(__dirname, '../../.env') });
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Supabase credentials not configured');
    return;
  }
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Credentials: Configured`);
  
  // Test connection
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Connection test failed: ${error.message}`);
    } else {
      console.log(`✅ Connection successful`);
      console.log(`📊 Patients table has ${count || 0} records`);
    }
  } catch (err) {
    console.log(`❌ Connection error: ${err.message}`);
  }
  
  console.log('\nPress Enter to continue...');
  await new Promise(resolve => rl.question('', resolve));
}

// Main menu loop
async function main() {
  let exit = false;
  
  while (!exit) {
    displayMenu();
    const choice = await getChoice();
    
    switch (choice) {
      case '1':
        console.clear();
        await performBackup();
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
        
      case '2':
        console.clear();
        rl.close();
        // Import and run restore
        const { performRestore: restoreFunction } = await import('./restore-database.js');
        await restoreFunction();
        // Recreate readline interface
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        break;
        
      case '3':
        console.clear();
        await viewBackupHistory();
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
        
      case '4':
        console.clear();
        await cleanOldBackupsInteractive();
        break;
        
      case '5':
        console.clear();
        await setupAutomatedBackups();
        break;
        
      case '6':
        console.clear();
        await checkDatabaseStatus();
        break;
        
      case '7':
        exit = true;
        console.log('\n👋 Goodbye!\n');
        break;
        
      default:
        console.log('\n❌ Invalid choice. Please try again.');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  rl.close();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { main };