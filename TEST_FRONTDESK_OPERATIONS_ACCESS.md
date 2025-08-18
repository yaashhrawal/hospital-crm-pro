# Testing Frontdesk Operations Access

## What has been updated:

### 1. Frontend Permissions Updated ✅
**File:** `src/services/authService.ts` (lines 252-255)
- Added `'access_operations'` permission to frontdesk role
- Updated comments to reflect new access

### 2. User Credentials Required:
**Email:** `frontdesk@valant.com`  
**Password:** `Front@123`

### 3. Database Setup Required:
Run the SQL script `UPDATE_FRONTDESK_USER.sql` to:
- Update existing frontdesk user email to `frontdesk@valant.com`
- Set proper role metadata
- Ensure user is active and has correct permissions

## Testing Steps:

### Step 1: Database Setup
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the script `UPDATE_FRONTDESK_USER.sql`
4. Verify the user exists with correct role

### Step 2: Password Update
1. Go to Supabase Dashboard > Authentication > Users
2. Find user with email `frontdesk@valant.com`
3. If user doesn't exist, create new user:
   - Email: `frontdesk@valant.com`
   - Password: `Front@123`
   - Role metadata: `{"role": "frontdesk", "full_name": "Front Desk Staff"}`
4. If user exists, update password to `Front@123`

### Step 3: Login Test
1. Start the application: `npm run dev`
2. Login with:
   - Email: `frontdesk@valant.com`
   - Password: `Front@123`
3. Verify you can see the "📊 Operations" tab in navigation
4. Click on Operations tab to access OperationsLedger component

## Expected Behavior:

### ✅ Frontdesk User Can Access:
- Dashboard
- Patient Entry
- Patient List (view only, no edit)
- **Operations Section** (NEW!)
- Billing
- IPD Management
- All other sections (without edit privileges)

### ❌ Frontdesk User Cannot:
- Edit patients in patient list
- Access admin-only functions
- Delete patients or critical data

## Troubleshooting:

### If Operations tab is not visible:
1. Check browser console for permission errors
2. Verify user role is exactly `"frontdesk"` (lowercase)
3. Ensure `access_operations` permission is in authService.ts
4. Check that user login is successful and role is loaded

### If login fails:
1. Verify user exists in Supabase Auth
2. Check password is set correctly
3. Ensure user is active in public.users table
4. Check console for detailed error messages

## Database Verification Query:
```sql
-- Run this to verify user setup
SELECT 
    au.email,
    au.raw_user_meta_data->>'role' as auth_role,
    u.role as public_role,
    u.is_active,
    u.full_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'frontdesk@valant.com';
```

## Final Result:
The frontdesk user (`frontdesk@valant.com`) now has full access to the Operations section where they can view transaction history, generate receipts, and access the operations ledger.