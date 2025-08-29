#!/bin/bash

# Supabase connection details
SUPABASE_HOST="db.oghqwddhojnryovmfvzc.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PORT="5432"

# Output files
SCHEMA_FILE="supabase_schema_export.sql"
DATA_FILE="supabase_data_export.sql"
COMPLETE_BACKUP="supabase_complete_backup.sql"

echo "==================================="
echo "Supabase Database Export Script"
echo "==================================="
echo ""
echo "Please enter the Supabase database password when prompted."
echo ""

# Export schema only
echo "Exporting database schema..."
pg_dump -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-security-labels \
    --no-publications \
    --no-subscriptions \
    -f $SCHEMA_FILE

if [ $? -eq 0 ]; then
    echo "✓ Schema exported successfully to $SCHEMA_FILE"
else
    echo "✗ Schema export failed"
    exit 1
fi

# Export data only
echo "Exporting database data..."
pg_dump -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
    --data-only \
    --no-owner \
    --no-privileges \
    --disable-triggers \
    -f $DATA_FILE

if [ $? -eq 0 ]; then
    echo "✓ Data exported successfully to $DATA_FILE"
else
    echo "✗ Data export failed"
    exit 1
fi

# Export complete backup
echo "Creating complete backup..."
pg_dump -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-security-labels \
    --no-publications \
    --no-subscriptions \
    -f $COMPLETE_BACKUP

if [ $? -eq 0 ]; then
    echo "✓ Complete backup created successfully to $COMPLETE_BACKUP"
else
    echo "✗ Complete backup failed"
    exit 1
fi

echo ""
echo "==================================="
echo "Export completed successfully!"
echo "==================================="
echo "Files created:"
echo "  - Schema: $SCHEMA_FILE"
echo "  - Data: $DATA_FILE"
echo "  - Complete: $COMPLETE_BACKUP"