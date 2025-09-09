import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface VerificationEmailRequest {
  email: string;
  name?: string;
  invitationContext?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Processing verification email request');
    
    const { email, name, invitationContext }: VerificationEmailRequest = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate verification link using Supabase's generateLink method
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://elyphant.ai'}/auth/callback`
      }
    });

    if (error) {
      console.error('Error generating verification link:', error);
      throw new Error(`Failed to generate verification link: ${error.message}`);
    }

    const verificationUrl = data.properties?.action_link;
    if (!verificationUrl) {
      throw new Error('Failed to generate verification URL');
    }

    console.log(`📧 Generated verification URL for ${email}`);

    // Customize email content based on invitation context
    const firstName = name?.split(' ')[0] || 'there';
    const isInvitation = !!invitationContext;
    const inviterName = invitationContext?.inviter_first_name || 'someone';

    const emailSubject = isInvitation 
      ? `${inviterName} invited you to Elyphant - Verify your email`
      : 'Verify your Elyphant account';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
            .gift-icon { font-size: 32px; margin: 10px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
            .btn:hover { transform: translateY(-2px); }
            .invitation-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
            .verification-code { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 16px; letter-spacing: 2px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐘 Elyphant</div>
              <div class="gift-icon">🎁</div>
              <h1 style="margin: 0; color: #1f2937;">
                ${isInvitation ? `Welcome to Elyphant, ${firstName}!` : `Verify your email, ${firstName}!`}
              </h1>
            </div>

            ${isInvitation ? `
              <div class="invitation-box">
                <h3 style="margin-top: 0; color: #6366f1;">🎉 You've been invited!</h3>
                <p><strong>${inviterName}</strong> invited you to join Elyphant to find perfect gifts and share your wishlist.</p>
              </div>
            ` : ''}

            <p>Click the button below to verify your email address and complete your account setup:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="btn">
                ✅ Verify Email Address
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
            </p>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
              </p>
            </div>

            ${isInvitation ? `
              <p style="margin-top: 20px;">After verifying your email, you'll be able to:</p>
              <ul style="color: #4b5563;">
                <li>🎯 Create and share your wishlist</li>
                <li>🔍 Find perfect gifts for friends and family</li>
                <li>🤝 Connect with ${inviterName} and start your gifting journey</li>
              </ul>
            ` : `
              <p style="margin-top: 20px;">After verifying your email, you'll be able to:</p>
              <ul style="color: #4b5563;">
                <li>🎯 Create and share your wishlist</li>
                <li>🔍 Discover perfect gifts with AI recommendations</li>
                <li>🤝 Connect with friends and family for gifting</li>
              </ul>
            `}

            <div class="footer">
              <p>Happy gifting!</p>
              <p>The Elyphant Team</p>
              <p style="font-size: 12px; margin-top: 15px;">
                If you have any questions, feel free to reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Elyphant <onboarding@resend.dev>',
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log(`✅ Verification email sent successfully to ${email}`);
    console.log(`📧 Resend ID: ${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email sent successfully',
        emailId: emailResponse.data?.id
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
    console.error('Error in send-verification-email function:', error);
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