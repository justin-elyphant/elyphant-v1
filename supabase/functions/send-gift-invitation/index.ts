import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftInvitationRequest {
  recipientEmail: string;
  recipientName: string;
  giftorName: string;
  occasion?: string;
  eventDate?: string;
  relationship?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🎁 Gift invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      giftorName, 
      occasion, 
      eventDate,
      relationship = 'friend'
    }: GiftInvitationRequest = await req.json();

    console.log("📧 Sending gift invitation:", { 
      recipientEmail, 
      recipientName, 
      giftorName, 
      occasion 
    });

    // Create personalized invitation message
    const occasionText = occasion ? ` for your upcoming ${occasion}` : '';
    const dateText = eventDate ? ` on ${new Date(eventDate).toLocaleDateString()}` : '';
    
    const invitationUrl = `${Deno.env.get("SUPABASE_URL") || 'https://your-project.supabase.co'}/profile-setup?invited=true&giftor=${encodeURIComponent(giftorName)}&occasion=${occasion || ''}&relationship=${relationship}`;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

    const emailResponse = await resend.emails.send({
      from: "Elyphant <hello@elyphant.ai>",
      to: [recipientEmail],
      subject: `${giftorName} wants to make sure you get the perfect gifts!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're Invited to Elyphant!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
              🎁 You're Invited to Elyphant!
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">
              ${giftorName} wants to get you amazing gifts${occasionText}${dateText}
            </p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 22px;">Hi ${recipientName}! 👋</h2>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4a5568;">
              ${giftorName} has invited you to join <strong>Elyphant</strong> - the platform that ensures you get gifts you'll actually love!
            </p>
            
            ${occasion ? `
              <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0; font-size: 16px; color: #2d3748;">
                  <strong>🎉 Special Occasion:</strong> ${giftorName} wants to make your ${occasion}${dateText} extra special!
                </p>
              </div>
            ` : ''}

            <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 20px;">✨ What makes Elyphant special?</h3>
            
            <ul style="padding-left: 0; list-style: none;">
              <li style="margin: 15px 0; padding-left: 30px; position: relative;">
                <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🎯</span>
                <strong>Perfect Gift Matching:</strong> Create your wishlist and preferences so ${giftorName} knows exactly what you love
              </li>
              <li style="margin: 15px 0; padding-left: 30px; position: relative;">
                <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🤖</span>
                <strong>AI-Powered Curation:</strong> Nicole, our AI gift advisor, learns your style and suggests amazing options
              </li>
              <li style="margin: 15px 0; padding-left: 30px; position: relative;">
                <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🎉</span>
                <strong>Surprise & Delight:</strong> Never get another gift you don't want - every surprise will be perfect
              </li>
              <li style="margin: 15px 0; padding-left: 30px; position: relative;">
                <span style="position: absolute; left: 0; top: 2px; font-size: 18px;">🔒</span>
                <strong>Privacy First:</strong> Your preferences are private - only you and your gift-givers see them
              </li>
            </ul>

            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748;">
                <strong>Ready to get gifts you'll love?</strong><br>
                Join Elyphant and help ${giftorName} pick the perfect gifts for you!
              </p>
              
              <a href="${invitationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0;">
                🎁 Create My Profile & Wishlist
              </a>
            </div>
          </div>

          <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting started is easy:</h3>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">1</span>
                <span>Click the link above to create your profile (takes 2 minutes)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">2</span>
                <span>Tell Nicole about your interests, brands you love, and sizes</span>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">3</span>
                <span>Enjoy receiving perfectly curated gifts from ${giftorName}!</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #718096; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              This invitation was sent by ${giftorName} through Elyphant.
            </p>
            <p style="margin: 0;">
              Questions? Reply to this email or visit our <a href="#" style="color: #667eea;">help center</a>.
            </p>
          </div>

        </body>
        </html>
      `,
    });

    console.log("✅ Gift invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      invitationUrl 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Error in send-gift-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);