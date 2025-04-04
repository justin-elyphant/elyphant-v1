
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GiftInvitationRequest {
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  recipientPhone?: string;
  senderName: string;
  senderUserId: string; // Added sender user ID to track referral
  productName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientFirstName, 
      recipientLastName, 
      recipientEmail, 
      recipientPhone, 
      senderName,
      senderUserId, // Get sender user ID
      productName 
    } = await req.json() as GiftInvitationRequest;

    // Validate inputs
    if (!recipientEmail || !recipientFirstName || !senderName || !senderUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // In a production environment, you would:
    // 1. Use a service like Resend, SendGrid, or AWS SES to send the email
    // 2. Use a service like Twilio to send SMS if phone number is provided
    console.log(`Sending invitation to ${recipientFirstName} ${recipientLastName} at ${recipientEmail}`);
    
    // Store the pending connection in the database for when the user signs up
    // This would be implemented with a database table in production
    // For now, let's assume we store it somewhere (would be a DB insert in prod)
    console.log(`Storing pending connection: Sender ${senderUserId} -> Recipient ${recipientEmail}`);
    
    // For now, just log and return a success response
    const invitationLink = `https://yourdomain.com/signup?invitedBy=${encodeURIComponent(senderName)}&senderUserId=${senderUserId}`;
    
    // Email would contain something like:
    const emailTemplate = `
      Hi ${recipientFirstName},
      
      ${senderName} is sending you a gift (${productName}) through our platform!
      
      Sign up now to track your gift and create your own wishlist:
      ${invitationLink}
      
      Looking forward to seeing you!
    `;
    
    console.log("Email content would be:", emailTemplate);
    
    // If you have SMS capability:
    if (recipientPhone) {
      const smsTemplate = `${senderName} is sending you a gift! Sign up here to track it: ${invitationLink}`;
      console.log("SMS content would be:", smsTemplate);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation sent successfully",
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
