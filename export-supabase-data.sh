#!/bin/bash

# Export real data from Supabase PostgreSQL
# Supabase connection details
SUPABASE_HOST="db.oghqwddhojnryovmfvzc.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PORT="5432"

echo "=========================================="
echo "Exporting REAL data from Supabase"
echo "=========================================="
echo ""
echo "Please enter the Supabase postgres password when prompted."
echo ""

# Export only the actual data tables (not system tables)
echo "Exporting real data from Supabase tables..."

# Export individual tables with data
pg_dump -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
    --data-only \
    --no-owner \
    --no-privileges \
    --disable-triggers \
    -t users \
    -t doctors \
    -t patients \
    -t patient_transactions \
    -t patient_admissions \
    -t beds \
    -t appointments \
    -t medicines \
    -t patient_visits \
    -t daily_expenses \
    -t discharge_summary \
    -f supabase_real_data.sql

if [ $? -eq 0 ]; then
    echo "✓ Real data exported successfully to supabase_real_data.sql"
    echo ""
    echo "Checking what data was exported:"
    echo "======================================="
    
    # Show preview of exported data
    if [ -f "supabase_real_data.sql" ]; then
        echo "File size: $(wc -c < supabase_real_data.sql) bytes"
        echo ""
        echo "Preview of exported data:"
        head -20 supabase_real_data.sql
        echo ""
        echo "... (file continues) ..."
        echo ""
        echo "Tables found in export:"
        grep -i "COPY public\." supabase_real_data.sql | head -10
    fi
else
    echo "✗ Data export failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Export completed! Check supabase_real_data.sql"
echo "=========================================="