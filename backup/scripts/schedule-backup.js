#!/usr/bin/env node

import { performBackup } from './backup-database.js';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  // Maximum number of backups to keep
  maxBackups: 30,
  // Backup schedule (if using with cron)
  schedule: {
    daily: '0 2 * * *',    // 2 AM every day
    weekly: '0 3 * * 0',   // 3 AM every Sunday
    monthly: '0 4 1 * *'   // 4 AM first day of month
  }
};

// Clean up old backups
async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...');
  
  const dataDir = path.join(__dirname, '../data');
  
  try {
    const files = await fs.readdir(dataDir);
    const backups = files
      .filter(f => f.startsWith('backup_'))
      .sort();
    
    if (backups.length <= CONFIG.maxBackups) {
      console.log(`   Current backups (${backups.length}) within limit (${CONFIG.maxBackups})`);
      return;
    }
    
    // Remove oldest backups
    const toRemove = backups.slice(0, backups.length - CONFIG.maxBackups);
    
    for (const backup of toRemove) {
      const backupPath = path.join(dataDir, backup);
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log(`   Removed old backup: ${backup}`);
    }
    
    console.log(`✅ Cleaned up ${toRemove.length} old backups`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

// Log backup activity
async function logBackupActivity(result) {
  const logDir = path.join(__dirname, '../logs');
  await fs.mkdir(logDir, { recursive: true });
  
  const logFile = path.join(logDir, 'backup-history.log');
  const timestamp = new Date().toISOString();
  
  let logEntry = `[${timestamp}] `;
  
  if (result.success) {
    logEntry += `SUCCESS - Backed up ${result.metadata.totalRecords} records to ${result.backupDir}\n`;
  } else {
    logEntry += `FAILED - ${result.error}\n`;
  }
  
  try {
    await fs.appendFile(logFile, logEntry);
  } catch (err) {
    console.error('Error writing to log:', err.message);
  }
}

// Send notification (can be extended to send emails, webhooks, etc.)
async function sendNotification(result) {
  if (!result.success) {
    console.error('🚨 BACKUP FAILED - Manual intervention required!');
    // In production, you might want to:
    // - Send email alert
    // - Post to Slack/Discord
    // - Trigger monitoring alert
  }
}

// Main scheduled backup function
async function runScheduledBackup(backupType = 'scheduled') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🕐 Starting ${backupType} backup at ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Perform backup
    const result = await performBackup();
    
    // Log activity
    await logBackupActivity(result);
    
    // Send notifications
    await sendNotification(result);
    
    // Clean up old backups
    if (result.success) {
      await cleanupOldBackups();
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏁 ${backupType} backup completed`);
    console.log(`${'='.repeat(60)}\n`);
    
    return result;
    
  } catch (error) {
    console.error('Fatal error in scheduled backup:', error);
    await logBackupActivity({ success: false, error: error.message });
    await sendNotification({ success: false, error: error.message });
    return { success: false, error: error.message };
  }
}

// Generate cron configuration
function generateCronConfig() {
  const cronConfig = `# Hospital CRM Database Backup Schedule
# Add these lines to your crontab (crontab -e)

# Daily backup at 2 AM
${CONFIG.schedule.daily} cd ${__dirname} && /usr/bin/node schedule-backup.js daily >> ../logs/cron.log 2>&1

# Weekly backup at 3 AM on Sunday (optional - for extra safety)
# ${CONFIG.schedule.weekly} cd ${__dirname} && /usr/bin/node schedule-backup.js weekly >> ../logs/cron.log 2>&1

# Monthly backup at 4 AM on the 1st (optional - for long-term archives)
# ${CONFIG.schedule.monthly} cd ${__dirname} && /usr/bin/node schedule-backup.js monthly >> ../logs/cron.log 2>&1
`;
  
  return cronConfig;
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupType = process.argv[2] || 'manual';
  
  if (backupType === 'setup') {
    // Show cron setup instructions
    console.log('📋 Cron Setup Instructions:\n');
    console.log(generateCronConfig());
    console.log('\nTo install:');
    console.log('1. Run: crontab -e');
    console.log('2. Add the lines above');
    console.log('3. Save and exit');
    console.log('\nTo verify: crontab -l');
  } else {
    // Run backup
    runScheduledBackup(backupType)
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
      });
  }
}

export { runScheduledBackup, cleanupOldBackups };