// Debug script to identify admin authentication issues
import { supabase } from './src/config/supabase.js';

async function debugAdminAuth() {
  console.log('🔍 === ADMIN AUTHENTICATION DEBUG ===');
  
  const adminEmail = 'admin@valant.com';
  
  try {
    // 1. Check if admin user exists in Supabase auth
    console.log('\n1️⃣ Checking Supabase auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    const adminAuthUser = authUsers?.users.find(u => u.email === adminEmail);
    
    if (adminAuthUser) {
      console.log('✅ Admin user found in auth.users:');
      console.log('  - ID:', adminAuthUser.id);
      console.log('  - Email:', adminAuthUser.email);
      console.log('  - Email Confirmed:', adminAuthUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('  - User Metadata:', JSON.stringify(adminAuthUser.user_metadata, null, 2));
      console.log('  - App Metadata:', JSON.stringify(adminAuthUser.app_metadata, null, 2));
    } else {
      console.log('❌ Admin user NOT found in auth.users');
      console.log('Available users:', authUsers?.users.map(u => u.email));
      return;
    }
    
    // 2. Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: profileUsers, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail);
    
    if (profileError) {
      console.error('❌ Error fetching profile users:', profileError);
    } else if (profileUsers && profileUsers.length > 0) {
      console.log('✅ Admin user found in users table:');
      console.log('  - Profile:', JSON.stringify(profileUsers[0], null, 2));
    } else {
      console.log('⚠️ Admin user NOT found in users table');
    }
    
    // 3. Test login process
    console.log('\n3️⃣ Testing login process...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'Admin@321'
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError);
    } else if (loginData.user) {
      console.log('✅ Login successful:');
      console.log('  - User ID:', loginData.user.id);
      console.log('  - Email:', loginData.user.email);
      console.log('  - User Metadata:', JSON.stringify(loginData.user.user_metadata, null, 2));
      console.log('  - App Metadata:', JSON.stringify(loginData.user.app_metadata, null, 2));
      
      // Test getCurrentUser from supabaseAuthService
      console.log('\n4️⃣ Testing getCurrentUser...');
      const { data: currentUserData } = await supabase.auth.getUser();
      
      if (currentUserData.user) {
        console.log('✅ Current user data:');
        console.log('  - User ID:', currentUserData.user.id);
        console.log('  - Email:', currentUserData.user.email);
        console.log('  - User Metadata Role:', currentUserData.user.user_metadata?.role);
        console.log('  - App Metadata Role:', currentUserData.user.app_metadata?.role);
        
        // Get role determination logic
        const roleFromMetadata = currentUserData.user.user_metadata?.role || currentUserData.user.app_metadata?.role;
        console.log('  - Role from metadata:', roleFromMetadata);
        
        // Check profile
        const { data: profile, error: profileGetError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUserData.user.id)
          .single();
        
        if (profileGetError) {
          console.log('  - Profile error:', profileGetError);
        } else {
          console.log('  - Profile role:', profile?.role);
        }
        
        const finalRole = roleFromMetadata || (profile?.role) || 'frontdesk';
        console.log('  - FINAL DETERMINED ROLE:', finalRole);
        console.log('  - Is Admin?', ['admin', 'ADMIN'].includes(finalRole));
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run debug
debugAdminAuth();