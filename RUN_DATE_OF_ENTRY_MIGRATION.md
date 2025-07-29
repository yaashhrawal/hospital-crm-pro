# Add Date of Entry Column Migration

## Problem
The application is trying to update a `date_of_entry` column in the `patients` table, but this column doesn't exist in the database schema. This causes the error: "Could not find the 'date_of_entry' column of 'patients' in the schema cache".

## Solution
Run the following SQL migration to add the missing `date_of_entry` column to the `patients` table.

## Steps to Fix

### 1. Run the Migration SQL
Execute the SQL commands in `ADD_DATE_OF_ENTRY_COLUMN.sql` in your Supabase SQL Editor:

```sql
-- Add date_of_entry column to patients table
ALTER TABLE patients 
ADD COLUMN date_of_entry DATE;

-- Update existing records to use created_at date as date_of_entry
UPDATE patients 
SET date_of_entry = DATE(created_at) 
WHERE date_of_entry IS NULL;
```

### 2. Verify the Column
After running the migration, verify the column was added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'date_of_entry';
```

### 3. Test the Application
- Try editing a patient record to confirm the error is resolved
- Create a new patient and verify the date_of_entry is saved
- Check that the "Last Visit" column in the patient list shows the correct dates

## What This Migration Does

1. **Adds the Column**: Adds `date_of_entry` as a DATE column to the patients table
2. **Populates Existing Data**: Sets the date_of_entry for existing patients using their created_at date
3. **Maintains Data Integrity**: Ensures no data is lost during the migration

## After Running the Migration

The application will now be able to:
- Save the date_of_entry when creating new patients
- Update the date_of_entry when editing existing patients  
- Display the date_of_entry in the "Last Visit" column of the patient list