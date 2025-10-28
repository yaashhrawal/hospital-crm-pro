# Test HRM Data Fetch in Browser Console

Since employees exist in the database but aren't showing in the UI, let's test the fetch directly in the browser console.

## Step 1: Open Browser Console
1. Go to http://localhost:3000
2. Press F12 or Right-click > Inspect
3. Go to the **Console** tab

## Step 2: Test Direct Query

Paste this code into the console and press Enter:

```javascript
// Import the necessary modules
import { supabase, HOSPITAL_ID } from './src/config/supabaseNew';

// Test query
const testQuery = async () => {
  console.log('🔍 Testing HRM data fetch...');
  console.log('Hospital ID:', HOSPITAL_ID);

  // Simple query without joins
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('hospital_id', HOSPITAL_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success! Found', data?.length || 0, 'employees');
    console.log('📊 Data:', data);
  }

  return { data, error };
};

// Run the test
testQuery();
```

## Step 3: Check for Console Logs

After refreshing the page and navigating to HRM > Employees, look for these logs:
- 🔍 HRM: Fetching employees...
- 🔍 HRM: Hospital ID: ...
- ✅ HRM: Fetched employees: X employees
- 📊 HRM: Employee data: [...]

## Step 4: Common Issues

### If you see "0 employees":
- **Issue**: Row Level Security (RLS) is blocking access
- **Fix**: Run `FIX_HRM_RLS_POLICIES.sql` in Supabase SQL Editor

### If you see an error about missing table:
- **Issue**: Tables not created yet
- **Fix**: Run `SETUP_HRM_TABLES_SIMPLE.sql` in Supabase SQL Editor

### If you see "Invalid UUID" error:
- **Issue**: Already fixed in the code
- **Fix**: Just refresh the page

### If the query works in console but UI is blank:
- **Issue**: React Query cache issue
- **Fix**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Alternative Quick Test

Or simply run this in console:
```javascript
window.location.reload(true); // Force hard refresh
```

Then navigate back to HRM > Employees section.
