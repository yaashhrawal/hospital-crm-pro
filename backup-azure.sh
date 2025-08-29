#!/bin/bash

# Azure PostgreSQL Backup Script for Hospital CRM
# This script creates backups of the Azure PostgreSQL database

# Configuration
AZURE_HOST="valantdb.postgres.database.azure.com"
AZURE_PORT="5432"
AZURE_DB="postgres"
AZURE_USER="divyansh04"
AZURE_PASSWORD="Rawal@00"

# Backup directory
BACKUP_DIR="backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hospital_crm_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "====================================="
echo "Azure PostgreSQL Backup Script"
echo "====================================="
echo "Date: $(date)"
echo "Backup file: $BACKUP_FILE"
echo ""

# Set environment variable for password
export PGPASSWORD="$AZURE_PASSWORD"

# Create backup
echo "Creating backup..."
pg_dump -h "$AZURE_HOST" -p "$AZURE_PORT" -U "$AZURE_USER" -d "$AZURE_DB" \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-security-labels \
    --compress=9 \
    -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✓ Backup completed successfully!"
    echo "File: $BACKUP_FILE"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Size: $FILE_SIZE"
    
    # Keep only last 7 backups
    echo ""
    echo "Cleaning up old backups (keeping last 7)..."
    ls -t "${BACKUP_DIR}"/hospital_crm_backup_*.sql | tail -n +8 | xargs -r rm
    
    echo "✓ Cleanup completed!"
    
    # List remaining backups
    echo ""
    echo "Available backups:"
    ls -lah "${BACKUP_DIR}"/hospital_crm_backup_*.sql 2>/dev/null || echo "No backups found"
    
else
    echo "✗ Backup failed!"
    exit 1
fi

# Unset password environment variable
unset PGPASSWORD

echo ""
echo "====================================="
echo "Backup process completed"
echo "====================================="