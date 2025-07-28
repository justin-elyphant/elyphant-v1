import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  phone: string;
  message: string;
  gifteeProfileId?: string;
}

interface IncomingSMSWebhook {
  MessageSid: string;
  Body: string;
  From: string;
  To: string;
}

const sendTwilioSMS = async (to: string, body: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: TWILIO_PHONE_NUMBER!,
      To: to,
      Body: body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  return await response.json();
};

const logSMSMessage = async (
  temporaryGifteeId: string | null,
  phoneNumber: string,
  messageContent: string,
  direction: 'inbound' | 'outbound',
  twilioMessageSid?: string
) => {
  const { error } = await supabase
    .from('sms_messages')
    .insert({
      temporary_giftee_id: temporaryGifteeId,
      phone_number: phoneNumber,
      message_content: messageContent,
      direction,
      twilio_message_sid: twilioMessageSid,
    });

  if (error) {
    console.error('Error logging SMS message:', error);
  }
};

const processIncomingSMS = async (webhook: IncomingSMSWebhook) => {
  const phoneNumber = webhook.From;
  const messageContent = webhook.Body.trim().toLowerCase();

  // Find existing temporary giftee profile
  const { data: gifteeProfile } = await supabase
    .from('temporary_giftee_profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('is_completed', false)
    .single();

  if (!gifteeProfile) {
    // No active discovery session - could be a standalone message
    await logSMSMessage(null, phoneNumber, webhook.Body, 'inbound', webhook.MessageSid);
    return { message: 'No active discovery session found' };
  }

  // Log the incoming message
  await logSMSMessage(gifteeProfile.id, phoneNumber, webhook.Body, 'inbound', webhook.MessageSid);

  const conversationState = gifteeProfile.sms_conversation_state || { phase: 'greeting', responses: [] };
  const currentPhase = conversationState.phase;

  let responseMessage = '';
  let nextPhase = currentPhase;
  const preferencesUpdate: any = { ...gifteeProfile.preferences_collected };

  // Process based on conversation phase
  switch (currentPhase) {
    case 'greeting':
      if (messageContent.includes('yes') || messageContent.includes('y')) {
        responseMessage = `Great! I'm helping ${gifteeProfile.recipient_name || 'someone special'} find the perfect gift for you for ${gifteeProfile.occasion || 'a special occasion'}. What are some things you're really interested in or have been wanting lately? (Just a few ideas would be helpful!)`;
        nextPhase = 'interests';
      } else if (messageContent.includes('no') || messageContent.includes('n')) {
        responseMessage = `No problem at all! I understand. Have a wonderful day! 😊`;
        nextPhase = 'declined';
      } else {
        responseMessage = `Hi! ${gifteeProfile.recipient_name || 'Someone special'} is planning a surprise gift for you for ${gifteeProfile.occasion || 'a special occasion'} and asked me to help find something you'd love. Would you like to help by sharing a few preferences? Reply YES or NO.`;
      }
      break;

    case 'interests':
      preferencesUpdate.interests = messageContent;
      responseMessage = `Thanks for sharing! What's your typical budget range for ${gifteeProfile.occasion || 'gifts'} - would you prefer something under $25, $25-50, $50-100, or over $100?`;
      nextPhase = 'budget';
      break;

    case 'budget':
      preferencesUpdate.budget_preference = messageContent;
      responseMessage = `Perfect! Last question - are there any specific brands you love or any types of gifts you'd prefer to avoid?`;
      nextPhase = 'final_preferences';
      break;

    case 'final_preferences':
      preferencesUpdate.brand_preferences = messageContent;
      responseMessage = `Thank you so much for your help! This will help ${gifteeProfile.recipient_name || 'them'} find something perfect for you. Have a wonderful day! 🎁`;
      nextPhase = 'completed';
      break;

    case 'completed':
    case 'declined':
      responseMessage = `Thank you for your earlier responses! No additional input needed. 😊`;
      break;

    default:
      responseMessage = `Thanks for your message! I'll make sure this gets passed along.`;
  }

  // Update the conversation state and preferences
  const updatedConversationState = {
    ...conversationState,
    phase: nextPhase,
    responses: [...(conversationState.responses || []), {
      phase: currentPhase,
      message: webhook.Body,
      timestamp: new Date().toISOString()
    }]
  };

  const isCompleted = nextPhase === 'completed' || nextPhase === 'declined';

  await supabase
    .from('temporary_giftee_profiles')
    .update({
      sms_conversation_state: updatedConversationState,
      preferences_collected: preferencesUpdate,
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    })
    .eq('id', gifteeProfile.id);

  // Send response SMS
  try {
    const twilioResponse = await sendTwilioSMS(phoneNumber, responseMessage);
    await logSMSMessage(gifteeProfile.id, phoneNumber, responseMessage, 'outbound', twilioResponse.sid);
  } catch (error) {
    console.error('Error sending SMS response:', error);
  }

  return { 
    message: 'SMS processed successfully',
    phase: nextPhase,
    completed: isCompleted
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle incoming SMS webhooks from Twilio
    if (req.method === 'POST' && url.pathname.includes('/webhook')) {
      const formData = await req.formData();
      const webhook: IncomingSMSWebhook = {
        MessageSid: formData.get('MessageSid') as string,
        Body: formData.get('Body') as string,
        From: formData.get('From') as string,
        To: formData.get('To') as string,
      };

      const result = await processIncomingSMS(webhook);
      
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml', ...corsHeaders },
      });
    }

    // Handle outbound SMS sending
    if (req.method === 'POST') {
      const { phone, message, gifteeProfileId }: SendSMSRequest = await req.json();

      const twilioResponse = await sendTwilioSMS(phone, message);
      
      if (gifteeProfileId) {
        await logSMSMessage(gifteeProfileId, phone, message, 'outbound', twilioResponse.sid);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        messageSid: twilioResponse.sid 
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('SMS service error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});