import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  eventType: string;
  recipientEmail: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventType, recipientEmail, data }: EmailRequest = await req.json();

    console.log(`📧 Orchestrating ${eventType} email for ${recipientEmail}`);

    // Call render-email-template to get the HTML
    const { data: renderedEmail, error: renderError } = await supabase.functions.invoke('render-email-template', {
      body: {
        eventType,
        data
      }
    });

    if (renderError) {
      console.error('❌ Failed to render email template:', renderError);
      throw renderError;
    }

    if (!renderedEmail?.html || !renderedEmail?.subject) {
      throw new Error('Email template rendering returned invalid data');
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Elyphant <noreply@elyphant.com>',
        to: [recipientEmail],
        subject: renderedEmail.subject,
        html: renderedEmail.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log(`✅ Email sent successfully via Resend:`, resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: resendData.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Email orchestration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
