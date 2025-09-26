import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddressRequestData {
  recipient_id: string;
  recipient_email: string;
  message: string;
  include_notifications: boolean;
  reminder_schedule: string;
  expires_in_days: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData: AddressRequestData = await req.json();

    // Get requester's profile
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !requesterProfile) {
      return new Response(JSON.stringify({ error: 'Requester profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create address request record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + requestData.expires_in_days);

    const { data: addressRequest, error: insertError } = await supabase
      .from('address_requests')
      .insert({
        requester_id: user.id,
        recipient_id: requestData.recipient_id,
        recipient_email: requestData.recipient_email,
        message: requestData.message,
        reminder_schedule: requestData.reminder_schedule,
        include_notifications: requestData.include_notifications,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating address request:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create address request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send email notification
    if (requestData.include_notifications) {
      // Use send-email-notification function instead of direct resend
      const supabaseServiceRole = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: emailResult, error: emailError } = await supabaseServiceRole.functions.invoke('send-email-notification', {
        body: {
          type: 'address_request',
          to: requestData.recipient_email,
          data: {
            requesterName: requesterProfile.name,
            message: requestData.message,
            expiresInDays: requestData.expires_in_days,
            requestId: addressRequest.id
          }
        }
      });

      console.log('Address request email sent:', emailResult);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      request_id: addressRequest.id,
      expires_at: addressRequest.expires_at 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-address-request function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);