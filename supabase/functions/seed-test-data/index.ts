import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating test users...');

    // Create admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true
    });

    if (adminError) {
      console.error('Admin creation error:', adminError);
    } else {
      console.log('Admin user created:', adminUser.user.id);
      await supabaseAdmin.from('user_roles').insert({
        user_id: adminUser.user.id,
        role: 'admin'
      });
    }

    // Create investor user
    const { data: investorUser, error: investorError } = await supabaseAdmin.auth.admin.createUser({
      email: 'investor@test.com',
      password: 'investor123',
      email_confirm: true
    });

    if (investorError) {
      console.error('Investor creation error:', investorError);
    } else {
      console.log('Investor user created:', investorUser.user.id);
      await supabaseAdmin.from('user_roles').insert({
        user_id: investorUser.user.id,
        role: 'investor'
      });
    }

    // Create farmer user
    const { data: farmerUser, error: farmerError } = await supabaseAdmin.auth.admin.createUser({
      email: 'farmer@test.com',
      password: 'farmer123',
      email_confirm: true
    });

    if (farmerError) {
      console.error('Farmer creation error:', farmerError);
    } else {
      console.log('Farmer user created:', farmerUser.user.id);
      await supabaseAdmin.from('user_roles').insert({
        user_id: farmerUser.user.id,
        role: 'farmer'
      });

      // Add dummy farms for the farmer
      const dummyFarms = [
        {
          user_id: farmerUser.user.id,
          farm_name: 'مزرعة النخيل',
          tons: 150,
          token_id: '0.0.4956206',
          transaction_id: '0.0.123456@1234567890.123456789',
          status: 'approved'
        },
        {
          user_id: farmerUser.user.id,
          farm_name: 'مزرعة الزيتون',
          tons: 200,
          token_id: '0.0.4956206',
          transaction_id: '0.0.123457@1234567891.123456790',
          status: 'approved'
        },
        {
          user_id: farmerUser.user.id,
          farm_name: 'مزرعة الحمضيات',
          tons: 100,
          token_id: '0.0.4956206',
          transaction_id: '0.0.123458@1234567892.123456791',
          status: 'pending'
        }
      ];

      const { error: farmsError } = await supabaseAdmin.from('farms').insert(dummyFarms);
      if (farmsError) {
        console.error('Farms creation error:', farmsError);
      } else {
        console.log('Dummy farms created');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test data seeded successfully',
        users: {
          admin: { email: 'admin@test.com', password: 'admin123' },
          investor: { email: 'investor@test.com', password: 'investor123' },
          farmer: { email: 'farmer@test.com', password: 'farmer123' }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
