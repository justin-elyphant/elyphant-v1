import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionValidationRequest {
  userId: string;
  sessionToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { userId, sessionToken }: SessionValidationRequest = await req.json();

    console.log('Session validation request:', { userId, hasToken: !!sessionToken });

    // Validate required fields
    if (!userId || !sessionToken) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          reason: 'Missing required fields',
          action: 'sign_out'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session not found or inactive:', sessionError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          reason: 'Session not found or inactive',
          action: 'sign_out'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check absolute timeout (30 days from creation)
    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);
    const createdAt = new Date(sessionData.created_at);
    const sessionAge = now.getTime() - createdAt.getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (now > expiresAt || sessionAge > maxAge) {
      console.log('Session expired due to absolute timeout');
      
      // Mark session as inactive
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionData.id);

      // Log security event
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: 'session_expired',
        details: {
          session_id: sessionData.id,
          reason: 'absolute_timeout',
          session_age_days: Math.floor(sessionAge / (24 * 60 * 60 * 1000)),
          expired_at: now.toISOString(),
        },
        user_agent: sessionData.user_agent || 'unknown',
        risk_level: 'low',
      });

      return new Response(
        JSON.stringify({ 
          valid: false, 
          reason: 'Session expired (30-day timeout)',
          action: 'sign_out',
          sessionAge: Math.floor(sessionAge / (24 * 60 * 60 * 1000)),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check inactivity timeout (7 days without activity)
    const lastActivity = new Date(sessionData.last_activity_at);
    const inactivityPeriod = now.getTime() - lastActivity.getTime();
    const maxInactivity = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (inactivityPeriod > maxInactivity) {
      console.log('Session expired due to inactivity');
      
      // Mark session as inactive
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionData.id);

      // Log security event
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: 'session_expired',
        details: {
          session_id: sessionData.id,
          reason: 'inactivity_timeout',
          inactive_days: Math.floor(inactivityPeriod / (24 * 60 * 60 * 1000)),
          expired_at: now.toISOString(),
        },
        user_agent: sessionData.user_agent || 'unknown',
        risk_level: 'low',
      });

      return new Response(
        JSON.stringify({ 
          valid: false, 
          reason: 'Session expired (7-day inactivity)',
          action: 'sign_out',
          inactiveDays: Math.floor(inactivityPeriod / (24 * 60 * 60 * 1000)),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Session is valid
    console.log('Session validated successfully');
    
    return new Response(
      JSON.stringify({ 
        valid: true,
        sessionAge: Math.floor(sessionAge / (24 * 60 * 60 * 1000)),
        lastActivity: sessionData.last_activity_at,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        reason: 'Internal server error',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
