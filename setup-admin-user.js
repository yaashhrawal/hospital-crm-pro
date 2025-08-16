// Setup admin user: admin@valant.com / Admin@321
// Run this to ensure admin user exists with proper role

import { supabase } from './src/config/supabase.js';

async function setupAdminUser() {
  console.log('🔧 Setting up admin user...');
  
  const adminEmail = 'admin@valant.com';
  const adminPassword = 'Admin@321';
  
  try {
    // Step 1: Check if user already exists
    console.log('🔍 Checking if admin user exists...');
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser?.users.find(u => u.email === adminEmail);
    
    if (adminExists) {
      console.log('✅ Admin user exists, updating metadata...');
      
      // Update user metadata to ensure admin role
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminExists.id,
        {
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            first_name: 'Admin',
            last_name: 'User'
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating admin user:', updateError);
        return;
      }
      
      console.log('✅ Admin user metadata updated');
      
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating admin user:', createError);
        return;
      }
      
      console.log('✅ New admin user created:', newUser.user?.email);
    }
    
    // Step 2: Update users table
    console.log('🔄 Updating users table...');
    
    const { data: userData } = await supabase.auth.admin.listUsers();
    const adminUser = userData?.users.find(u => u.email === adminEmail);
    
    if (adminUser) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: adminUser.id,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('❌ Error updating users table:', profileError);
      } else {
        console.log('✅ Users table updated');
      }
    }
    
    // Step 3: Verify setup
    console.log('🔍 Verifying admin setup...');
    const { data: verifyUser } = await supabase.auth.admin.listUsers();
    const verifyAdmin = verifyUser?.users.find(u => u.email === adminEmail);
    
    if (verifyAdmin) {
      console.log('✅ Admin user verification:');
      console.log('📧 Email:', verifyAdmin.email);
      console.log('👑 Role (metadata):', verifyAdmin.user_metadata?.role);
      console.log('🆔 ID:', verifyAdmin.id);
      console.log('✅ Confirmed:', verifyAdmin.email_confirmed_at ? 'Yes' : 'No');
    }
    
    console.log('🎉 Admin user setup complete!');
    console.log('📧 Login with: admin@valant.com');
    console.log('🔑 Password: Admin@321');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
}

// Run the setup
setupAdminUser();