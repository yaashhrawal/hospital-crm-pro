#!/bin/bash

# Azure PostgreSQL Restore Script for Hospital CRM
# This script restores a backup to the Azure PostgreSQL database

# Configuration
AZURE_HOST="valantdb.postgres.database.azure.com"
AZURE_PORT="5432"
AZURE_DB="postgres"
AZURE_USER="divyansh04"
AZURE_PASSWORD="Rawal@00"

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql>"
    echo ""
    echo "Available backups:"
    ls -lah backups/hospital_crm_backup_*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo "====================================="
echo "Azure PostgreSQL Restore Script"
echo "====================================="
echo "Date: $(date)"
echo "Backup file: $BACKUP_FILE"
echo ""

# Warning
echo "WARNING: This will overwrite the existing database!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Set environment variable for password
export PGPASSWORD="$AZURE_PASSWORD"

echo ""
echo "Restoring database..."

# Restore backup
psql -h "$AZURE_HOST" -p "$AZURE_PORT" -U "$AZURE_USER" -d "$AZURE_DB" \
    -f "$BACKUP_FILE"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database restored successfully!"
else
    echo ""
    echo "✗ Database restore failed!"
    exit 1
fi

# Unset password environment variable
unset PGPASSWORD

echo ""
echo "====================================="
echo "Restore process completed"
echo "====================================="