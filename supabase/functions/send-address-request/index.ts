import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
      const emailResponse = await resend.emails.send({
        from: "Elyphant <noreply@elyphant.com>",
        to: [requestData.recipient_email],
        subject: `${requesterProfile.name} needs your address for gift delivery`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">Address Request</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>${requesterProfile.name}</strong> has requested your shipping address for gift delivery.</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 0; font-style: italic;">"${requestData.message}"</p>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                This request will expire in ${requestData.expires_in_days} days.
                Your address will only be used for gift deliveries and kept private.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.')}/connections?tab=address-requests" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Share Your Address
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 12px; text-align: center;">
              <p>This request was sent through Elyphant. If you don't want to receive these notifications, you can update your preferences in your account settings.</p>
            </div>
          </div>
        `,
      });

      console.log('Address request email sent:', emailResponse);
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