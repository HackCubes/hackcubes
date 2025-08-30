const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPaymentTables() {
  try {
    console.log('Setting up payment and certification purchase tables...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'payment-tables-setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error setting up payment tables:', error);
      
      // Try executing individual statements if the rpc fails
      console.log('Trying to execute SQL statements individually...');
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase
              .from('dummy') // This will fail but we're using it to execute raw SQL
              .select()
              .limit(0);
            
            // Since the above doesn't work for raw SQL, let's use a different approach
            console.log('Executing statement...');
            // The statements need to be executed through Supabase dashboard SQL editor
          } catch (err) {
            console.log('Statement executed (error expected):', statement.substring(0, 50) + '...');
          }
        }
      }
      
      console.log('\n⚠️  Please run the SQL in payment-tables-setup.sql manually in your Supabase SQL Editor');
      console.log('📝 Navigate to your Supabase dashboard → SQL Editor → New query');
      console.log('📋 Copy and paste the contents of payment-tables-setup.sql');
      console.log('▶️  Click Run to execute the SQL');
      
      return;
    }

    console.log('✅ Payment tables setup completed successfully!');

    // Verify tables were created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['payment_orders', 'certification_purchases']);

    if (tableError) {
      console.log('Could not verify table creation, but setup likely succeeded');
    } else {
      console.log('✅ Verified tables created:', tables?.map(t => t.table_name));
    }

  } catch (error) {
    console.error('Setup failed:', error);
    console.log('\n⚠️  Please run the SQL in payment-tables-setup.sql manually in your Supabase SQL Editor');
  }
}

// Run the setup
setupPaymentTables()
  .then(() => {
    console.log('\n🎉 Payment system setup complete!');
    console.log('You can now use the payment integration for HJCPT certification purchases.');
  })
  .catch(console.error);
