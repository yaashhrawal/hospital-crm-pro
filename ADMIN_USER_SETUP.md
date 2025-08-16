# Admin User Setup Instructions

## Admin Credentials
- **Email**: admin@valant.com
- **Password**: Admin@321
- **Role**: admin (full access to all features)

## How to Create Admin User

### Method 1: Through Application UI
1. Go to the application login page
2. If there's a signup option, sign up with the admin credentials
3. The system should automatically detect admin@valant.com and assign admin role

### Method 2: Manual Database Setup
If the user already exists in auth.users, run this SQL:

```sql
-- Update existing user to admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'first_name', 'Admin', 
  'last_name', 'User'
)
WHERE email = 'admin@valant.com';

-- Update users table
UPDATE users 
SET role = 'admin', first_name = 'Admin', last_name = 'User', is_active = true
WHERE email = 'admin@valant.com';
```

## Admin Permissions
The admin user has **UNRESTRICTED ACCESS** to everything:

✅ **All Sections** (No Restrictions):
- Dashboard (full access)
- Patient Entry (create/edit/delete)
- Patient List (full edit/delete access)
- IPD Beds Management (full access)
- Discharge Management (full access)
- Expenses (create/edit/delete)
- Refunds (process/edit/delete)
- Billing (create/edit/delete)
- **Operations Section (full access)**
- All future features and sections

🔓 **Unlimited Permissions**:
Admin users bypass ALL permission checks and have access to every feature, button, and functionality in the system. They are not restricted by any permission-based limitations.

## Verification
After creating the admin user:

1. Login with admin@valant.com / Admin@321
2. Verify all tabs are visible in the navigation
3. Verify Operations section is accessible
4. Verify edit buttons are available in patient lists
5. Verify all functionality works without restrictions

## Frontdesk vs Admin Comparison

| Feature | Frontdesk | Admin |
|---------|-----------|-------|
| Dashboard | ✅ View | ✅ Full |
| Patient Entry | ✅ Create | ✅ Full |
| Patient List | ❌ No Edit | ✅ Full Edit |
| Operations | ❌ Hidden | ✅ Full Access |
| Billing | ✅ Create/View | ✅ Full |
| All Other Sections | ✅ View Only | ✅ Full Access |