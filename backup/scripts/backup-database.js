#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
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

// Tables to backup
const TABLES_TO_BACKUP = [
  'users',
  'patients',
  'departments',
  'appointments',
  'bills',
  'patient_admissions',
  'bed_assignments',
  'beds',
  'doctors',
  'patient_visits',
  'patient_transactions',
  'discharge_summaries',
  'doctors_departments',
  'admission_doctors',
  'hospital_experience',
  'transaction_types',
  'medications',
  'prescriptions',
  'lab_tests',
  'lab_results',
  'inventory_items',
  'inventory_transactions',
  'refunds'
];

// Create backup directory with timestamp
async function createBackupDirectory() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupDir = path.join(__dirname, '../data', `backup_${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });
  return { backupDir, timestamp };
}

// Fetch all data from a table with pagination
async function fetchTableData(tableName) {
  const allData = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  console.log(`📥 Fetching data from ${tableName}...`);

  while (hasMore) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn(`⚠️  Warning: Could not fetch ${tableName}: ${error.message}`);
        return null;
      }

      if (data && data.length > 0) {
        allData.push(...data);
        offset += limit;
        
        // Check if we have more data
        hasMore = count ? offset < count : false;
        
        console.log(`   Fetched ${allData.length}/${count || '?'} records...`);
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.warn(`⚠️  Warning: Error fetching ${tableName}: ${err.message}`);
      return null;
    }
  }

  console.log(`✅ Fetched ${allData.length} records from ${tableName}`);
  return allData;
}

// Save data to JSON file
async function saveToFile(backupDir, tableName, data) {
  if (!data) return false;
  
  const filePath = path.join(backupDir, `${tableName}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${tableName}.json (${data.length} records)`);
    return true;
  } catch (err) {
    console.error(`❌ Error saving ${tableName}.json: ${err.message}`);
    return false;
  }
}

// Create backup metadata
async function createMetadata(backupDir, timestamp, backupResults) {
  const metadata = {
    timestamp,
    date: new Date().toISOString(),
    supabaseUrl,
    tables: backupResults,
    version: '1.0.0',
    totalRecords: Object.values(backupResults).reduce((sum, result) => 
      sum + (result.success ? result.recordCount : 0), 0
    )
  };

  const metadataPath = path.join(backupDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('📋 Created backup metadata');
  return metadata;
}

// Create a summary report
async function createSummaryReport(backupDir, metadata) {
  let report = `# Hospital CRM Database Backup Report\n\n`;
  report += `**Date:** ${new Date(metadata.date).toLocaleString()}\n`;
  report += `**Backup ID:** ${metadata.timestamp}\n`;
  report += `**Total Records:** ${metadata.totalRecords}\n\n`;
  
  report += `## Table Summary\n\n`;
  report += `| Table | Status | Records | File Size |\n`;
  report += `|-------|--------|---------|------------|\n`;
  
  for (const [table, result] of Object.entries(metadata.tables)) {
    if (result.success) {
      const filePath = path.join(backupDir, `${table}.json`);
      try {
        const stats = await fs.stat(filePath);
        const size = (stats.size / 1024).toFixed(2);
        report += `| ${table} | ✅ Success | ${result.recordCount} | ${size} KB |\n`;
      } catch {
        report += `| ${table} | ✅ Success | ${result.recordCount} | N/A |\n`;
      }
    } else {
      report += `| ${table} | ❌ Failed | 0 | N/A |\n`;
    }
  }
  
  const reportPath = path.join(backupDir, 'backup-report.md');
  await fs.writeFile(reportPath, report);
  console.log('📄 Created backup report');
}

// Main backup function
async function performBackup() {
  console.log('🚀 Starting Hospital CRM Database Backup...\n');
  
  try {
    // Create backup directory
    const { backupDir, timestamp } = await createBackupDirectory();
    console.log(`📁 Created backup directory: ${backupDir}\n`);
    
    const backupResults = {};
    
    // Backup each table
    for (const tableName of TABLES_TO_BACKUP) {
      const data = await fetchTableData(tableName);
      const success = await saveToFile(backupDir, tableName, data);
      
      backupResults[tableName] = {
        success,
        recordCount: data ? data.length : 0
      };
    }
    
    // Create metadata and report
    const metadata = await createMetadata(backupDir, timestamp, backupResults);
    await createSummaryReport(backupDir, metadata);
    
    // Create a latest backup symlink (for easy access)
    const latestLink = path.join(__dirname, '../data', 'latest');
    try {
      await fs.unlink(latestLink).catch(() => {}); // Remove existing link if any
      await fs.symlink(backupDir, latestLink);
    } catch (err) {
      // Symlinks might not work on all systems
    }
    
    console.log('\n✨ Backup completed successfully!');
    console.log(`📍 Location: ${backupDir}`);
    console.log(`📊 Total records backed up: ${metadata.totalRecords}`);
    
    return { success: true, backupDir, metadata };
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performBackup()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { performBackup, fetchTableData };