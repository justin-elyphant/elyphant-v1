import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing verification email system');
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasResendKey: !!resendApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      origin: req.headers.get('origin')
    });

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Test Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Elyphant <onboarding@resend.dev>',
        to: ['test@example.com'], // This will fail but test API key
        subject: 'Test Email',
        html: '<p>Test</p>',
      }),
    });
    
    const resendResult = await resendResponse.text();
    console.log('Resend test result:', { status: resendResponse.status, result: resendResult });

    // Test Supabase auth admin
    const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: 'test@example.com',
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://78c3ae13-28be-4c53-9235-ca0f8b2a6e91.sandbox.lovable.dev'}/auth/callback`
      }
    });

    console.log('Supabase link generation test:', { 
      success: !linkError, 
      error: linkError?.message,
      hasActionLink: !!linkData?.properties?.action_link 
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test completed - check logs',
        tests: {
          resend: {
            hasApiKey: !!resendApiKey,
            apiStatus: resendResponse.status,
            apiResponse: resendResult
          },
          supabase: {
            linkGeneration: !linkError,
            error: linkError?.message,
            hasActionLink: !!linkData?.properties?.action_link
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);