import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Test signup function called');
    
    const { email, password } = await req.json();
    console.log('Attempting signup for:', email);

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Calling auth.admin.createUser...');
    const startTime = Date.now();
    
    // Create the user without email confirmation (they need to verify)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false // Require email verification
    });

    const endTime = Date.now();
    console.log('Signup completed in:', endTime - startTime, 'ms');
    console.log('Signup result:', { user: userData.user?.id, error: userError });

    if (userError) {
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User created successfully:', userData.user?.id);

    // Send verification email using send-verification-email function
    try {
      const verificationResult = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: email.split('@')[0]
        })
      });

      if (!verificationResult.ok) {
        console.error('Failed to send verification email');
        // Don't fail the whole process if verification email fails
      } else {
        console.log('✅ Verification email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the whole process if verification email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully. Please check your email for verification link.',
        user: {
          id: userData.user?.id,
          email: userData.user?.email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Test signup exception:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});