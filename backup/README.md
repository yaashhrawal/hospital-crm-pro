# Hospital CRM Database Backup System

A comprehensive backup and restore solution for the Hospital CRM Supabase database with **two backup methods**.

## 🎯 **Two Backup Methods Available**

### **1. JSON API Backup (Default)**
- ✅ **Easy Setup**: No additional tools required
- ✅ **Cross-Platform**: Works everywhere Node.js runs
- ✅ **Detailed Reports**: Human-readable JSON format
- ⚠️ **Slower**: Uses Supabase API calls
- ⚠️ **Larger Files**: JSON format is verbose

### **2. PostgreSQL Native Backup (Recommended)**
- 🚀 **10x Faster**: Uses native PostgreSQL tools
- 📦 **90% Smaller**: Compressed binary format
- 🔧 **Complete**: Includes constraints, indexes, triggers
- 🛡️ **Industry Standard**: Professional backup method
- ⚙️ **Setup Required**: Needs PostgreSQL tools installed

## Features

- 📥 **Multiple Backup Methods**: JSON API + PostgreSQL native
- 📤 **Complete Restore**: Restore from any backup with data validation
- 🕐 **Automated Scheduling**: Daily/weekly/monthly backup options
- 🧹 **Auto-cleanup**: Automatically removes old backups
- 📊 **Backup Reports**: Detailed reports for each backup
- 🔄 **Interactive Manager**: User-friendly CLI interface

## Installation

### **Basic Setup (JSON Backups)**
1. Ensure Node.js is installed on your system
2. Navigate to the hospital-crm-pro directory
3. Install dependencies if not already installed:
   ```bash
   npm install
   ```

### **Advanced Setup (PostgreSQL Backups)**
4. Install PostgreSQL tools:
   ```bash
   # Run the setup script
   ./backup/scripts/setup-pg-tools.sh
   
   # Or install manually:
   # macOS: brew install postgresql
   # Ubuntu: sudo apt-get install postgresql-client
   # Windows: Download from https://postgresql.org/download/
   ```

5. Add database password to `.env`:
   ```env
   SUPABASE_DB_PASSWORD=your_database_password_here
   ```
   
   Find your password in Supabase Dashboard → Settings → Database → Connection string

## Usage

### 🚀 **Quick Start Commands**

**JSON API Backups (Default):**
```bash
npm run backup              # Create JSON backup
npm run backup:restore      # Restore from JSON backup
npm run backup:manager      # Interactive menu
```

**PostgreSQL Native Backups (Recommended):**
```bash
npm run backup:pg           # Create PostgreSQL backup
npm run backup:pg-restore   # Restore from PostgreSQL backup
./backup/scripts/setup-pg-tools.sh  # Install PostgreSQL tools
```

### 📋 **Which Method Should I Use?**

**Use PostgreSQL Native if:**
- ✅ You want the fastest backups (10x faster)
- ✅ You need smallest backup files (90% smaller)  
- ✅ You want complete database structure backup
- ✅ You're running in production environment

**Use JSON API if:**
- ✅ You want quick setup with no tools to install
- ✅ You need human-readable backup files
- ✅ You're developing or testing
- ✅ You want cross-platform compatibility

### Automated Backups

Set up automated daily backups:

```bash
# View cron setup instructions
node backup/scripts/schedule-backup.js setup

# Or manually add to crontab:
crontab -e

# Add this line for daily 2 AM backups:
0 2 * * * cd /Users/mac/hospital-crm-pro/backup/scripts && /usr/bin/node schedule-backup.js daily
```

## Backup Structure

Each backup creates a timestamped directory containing:

```
backup_2025-07-30_14-30-45/
├── patients.json          # Patient records
├── appointments.json      # Appointment data
├── bills.json            # Billing information
├── departments.json      # Department data
├── doctors.json          # Doctor records
├── metadata.json         # Backup metadata
└── backup-report.md      # Human-readable report
```

## Configuration

### Environment Variables

The backup system uses the same `.env` file as your application:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backup Settings

Edit `schedule-backup.js` to configure:

- `maxBackups`: Maximum number of backups to keep (default: 30)
- `schedule`: Cron schedules for automated backups

## Tables Backed Up

The system backs up all critical tables:

- users
- patients
- departments
- appointments
- bills
- patient_admissions
- bed_assignments
- beds
- doctors
- patient_visits
- patient_transactions
- discharge_summaries
- And more...

## Security Considerations

1. **Access Control**: Ensure backup directories have proper permissions
2. **Encryption**: Consider encrypting backups for sensitive data
3. **Off-site Storage**: Regularly copy backups to secure off-site location
4. **Testing**: Regularly test restore procedures

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file exists with correct credentials

2. **"Could not fetch table"**
   - Check table exists in Supabase
   - Verify RLS policies allow read access

3. **"Permission denied"**
   - Ensure script has execute permissions: `chmod +x backup-database.js`

### Logs

Check backup logs at:
```
backup/logs/backup-history.log
```

## Best Practices

1. **Regular Backups**: Run daily backups at minimum
2. **Test Restores**: Periodically test restore process
3. **Monitor Logs**: Check backup logs for failures
4. **Version Control**: Don't commit backup data to git
5. **Retention Policy**: Keep backups for at least 30 days

## Emergency Recovery

In case of data loss:

1. Don't panic - backups are timestamped
2. List available backups: `ls backup/data/`
3. Use restore tool to recover data
4. Verify data integrity after restore

## Support

For issues or questions:
- Check logs in `backup/logs/`
- Review error messages carefully
- Ensure Supabase connection is working

## License

Part of Hospital CRM Pro - All rights reserved