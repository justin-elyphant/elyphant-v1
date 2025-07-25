import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, sessionId } = await req.json();

    console.log('Nicole ChatGPT Agent:', { message, context, sessionId });

    // Specialized agent instructions for gift collection
    const systemPrompt = `You are Nicole, an AI gift advisor specializing in quick gift collection and recommendations.

Your role is to conversationally collect the following information for gift recommendations:
1. Recipient details (name, relationship to user)
2. Occasion (birthday, holiday, celebration, etc.)
3. Budget range (min and max amounts)
4. Recipient's phone number (for SMS delivery)
5. Payment preferences

GUIDELINES:
- Be conversational and friendly, not robotic
- Ask one question at a time naturally
- Validate information as you collect it
- Remember what's been shared and reference it
- When you have enough info, offer to show gift recommendations
- For phone numbers, ensure proper format validation
- For budget, suggest reasonable ranges if user seems uncertain

CURRENT CONTEXT:
- Collection Phase: ${context.giftCollectionPhase || 'recipient'}
- Recipient: ${context.recipientInfo?.name || 'Not provided'}
- Relationship: ${context.recipientInfo?.relationship || 'Not specified'}
- Occasion: ${context.occasion || 'Not specified'}
- Budget: ${context.budget ? `$${context.budget[0]}-$${context.budget[1]}` : 'Not specified'}
- Phone: ${context.recipientInfo?.phone || 'Not provided'}

Respond naturally and guide the conversation toward collecting missing information.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Analyze the response to determine next collection phase and extract information
    const updatedContext = analyzeResponseAndUpdateContext(aiMessage, message, context);

    return new Response(JSON.stringify({
      message: aiMessage,
      context: updatedContext,
      capability: 'gift_advisor',
      actions: determineAvailableActions(updatedContext),
      showSearchButton: isReadyForSearch(updatedContext),
      metadata: {
        confidence: 0.9,
        contextUpdates: updatedContext
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nicole-chatgpt-agent function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I'm having trouble processing your request right now. Could you try again?",
      context: context || {},
      capability: 'conversation',
      actions: [],
      showSearchButton: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeResponseAndUpdateContext(aiMessage: string, userMessage: string, context: any) {
  const updatedContext = { ...context };
  const lowerUserMessage = userMessage.toLowerCase();
  const lowerAiMessage = aiMessage.toLowerCase();

  // Extract recipient name from user message
  if (!updatedContext.recipientInfo?.name && (lowerUserMessage.includes('for ') || lowerUserMessage.includes('gift'))) {
    const nameMatch = userMessage.match(/for ([A-Za-z\s]+)/i);
    if (nameMatch) {
      updatedContext.recipientInfo = updatedContext.recipientInfo || {};
      updatedContext.recipientInfo.name = nameMatch[1].trim();
    }
  }

  // Extract occasion
  const occasions = ['birthday', 'christmas', 'anniversary', 'graduation', 'wedding', 'holiday', 'valentine', 'mother\'s day', 'father\'s day'];
  if (!updatedContext.occasion) {
    for (const occasion of occasions) {
      if (lowerUserMessage.includes(occasion)) {
        updatedContext.occasion = occasion;
        break;
      }
    }
  }

  // Extract budget
  if (!updatedContext.budget) {
    const budgetMatch = userMessage.match(/\$(\d+).*\$(\d+)/);
    if (budgetMatch) {
      updatedContext.budget = [parseInt(budgetMatch[1]), parseInt(budgetMatch[2])];
    } else {
      const singleBudgetMatch = userMessage.match(/\$(\d+)/);
      if (singleBudgetMatch) {
        const amount = parseInt(singleBudgetMatch[1]);
        updatedContext.budget = [Math.max(10, amount - 20), amount + 30];
      }
    }
  }

  // Extract phone number
  if (!updatedContext.recipientInfo?.phone) {
    const phoneMatch = userMessage.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      updatedContext.recipientInfo = updatedContext.recipientInfo || {};
      updatedContext.recipientInfo.phone = phoneMatch[1];
    }
  }

  // Determine next collection phase
  if (!updatedContext.recipientInfo?.name) {
    updatedContext.giftCollectionPhase = 'recipient';
  } else if (!updatedContext.occasion) {
    updatedContext.giftCollectionPhase = 'occasion';
  } else if (!updatedContext.budget) {
    updatedContext.giftCollectionPhase = 'budget';
  } else if (!updatedContext.recipientInfo?.phone) {
    updatedContext.giftCollectionPhase = 'payment';
  } else {
    updatedContext.giftCollectionPhase = 'confirmation';
  }

  return updatedContext;
}

function determineAvailableActions(context: any): string[] {
  const actions = ['continue_conversation'];
  
  if (context.recipientInfo?.name) {
    actions.push('analyze_preferences');
  }
  
  if (context.recipientInfo?.name && context.occasion) {
    actions.push('generate_recommendations');
  }
  
  if (isReadyForSearch(context)) {
    actions.push('start_search', 'process_gift_order');
  }
  
  return actions;
}

function isReadyForSearch(context: any): boolean {
  return !!(
    context.recipientInfo?.name &&
    context.occasion &&
    context.budget &&
    context.recipientInfo?.phone
  );
}