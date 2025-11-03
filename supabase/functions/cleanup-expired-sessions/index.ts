import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cleanup Expired Sessions Cron Job
 * Runs daily at 2 AM to clean up expired and inactive sessions
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting session cleanup job...');

    // Call the cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_sessions');

    if (cleanupError) {
      console.error('Error during session cleanup:', cleanupError);
      throw cleanupError;
    }

    // Get count of remaining active sessions
    const { count: activeSessionsCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log('Session cleanup completed successfully');
    console.log('Active sessions remaining:', activeSessionsCount);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Session cleanup completed',
        activeSessionsCount,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Session cleanup job failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
