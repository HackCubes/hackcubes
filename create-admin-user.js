const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user for testing...');

    // Create a test admin user
    const adminEmail = 'admin@hackcubes.com';
    const adminPassword = 'admin123456';

    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);
    
    if (existingUser) {
      console.log('✅ Admin user already exists:', adminEmail);
      
      // Update their profile to be admin
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: existingUser.id,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'User',
          is_admin: true
        });

      if (updateError) {
        console.error('❌ Error updating admin profile:', updateError);
      } else {
        console.log('✅ Admin profile updated');
      }
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      if (createError) {
        console.error('❌ Error creating admin user:', createError);
        return;
      }

      console.log('✅ Admin user created:', adminEmail);

      // Set admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'User',
          is_admin: true
        });

      if (profileError) {
        console.error('❌ Error creating admin profile:', profileError);
      } else {
        console.log('✅ Admin profile created');
      }
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🔐 Admin access: Enabled');
    console.log('\nYou can now:');
    console.log('1. Sign in as admin at /auth/signin');
    console.log('2. Access admin reports at /admin/reports');
    console.log('3. Review submitted reports');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the admin creation
createAdminUser();
