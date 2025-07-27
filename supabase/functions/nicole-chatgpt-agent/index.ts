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

    // Enhanced system prompt for Phase 2 structured gift collection
    const systemPrompt = `You are Nicole, an AI gift advisor for Elyphant. You help users find perfect gifts through a structured, conversational approach.

CURRENT COLLECTION PHASE: ${context.giftCollectionPhase || 'recipient'}
CONVERSATION TYPE: ${context.conversationPhase || 'standard'}
USER INTENT: ${context.selectedIntent || 'unknown'}

Your structured approach:

**PHASE: RECIPIENT** - Collect recipient details
- Ask for recipient name and relationship in one natural question
- Example: "Who is this gift for? Please tell me their name and your relationship to them."
- Extract: recipientInfo.name, relationship

**PHASE: OCCASION** - Understand the occasion  
- Ask about the specific occasion or event
- Example: "What's the occasion? Is this for a birthday, anniversary, holiday, or something else?"
- Extract: occasion, any relevant dates

**PHASE: BUDGET** - Determine budget range
- Ask for comfortable spending range with helpful suggestions
- Example: "What's your budget range for this gift? I can suggest options in ranges like $25-50, $50-100, $100-200, or whatever works for you."
- Extract: budget as [min, max] array

**PHASE: PAYMENT** - Collect contact information (only for auto-gift intent)
- Ask for recipient's phone number for delivery coordination
- Example: "Perfect! To coordinate the surprise delivery, what's their phone number?"
- Extract: recipientInfo.phone

**PHASE: CONFIRMATION** - Ready for recommendations
- Summarize collected info and offer to search marketplace
- Signal readiness with enthusiasm

GUIDELINES:
- Be warm, conversational, and naturally helpful - not robotic
- Ask ONE question at a time per phase to avoid overwhelming
- If user provides multiple pieces of info at once, acknowledge all and smoothly transition to next missing phase
- Reference previously shared information to show you're listening
- For auto-gift intent, collect phone number; for others, skip to confirmation after budget
- Always maintain Nicole's helpful, enthusiastic personality

CURRENT COLLECTION STATUS:
- Recipient: ${context.recipientInfo?.name || 'Not provided'} ${context.relationship ? `(${context.relationship})` : ''}
- Occasion: ${context.occasion || 'Not specified'}
- Budget: ${context.budget ? `$${context.budget[0]}-$${context.budget[1]}` : 'Not specified'}
- Phone: ${context.recipientInfo?.phone || (context.selectedIntent === 'auto-gift' ? 'Not provided' : 'Not needed')}
- Progress: ${context.collectionProgress ? Object.entries(context.collectionProgress).filter(([k,v]) => v).map(([k]) => k).join(', ') : 'Just started'}

Respond naturally as Nicole and guide toward collecting the next missing piece of information.`;

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

  // Enhanced phase determination for Phase 2
  const hasRecipient = updatedContext.recipientInfo?.name;
  const hasOccasion = updatedContext.occasion;
  const hasBudget = updatedContext.budget;
  const hasPhone = updatedContext.recipientInfo?.phone;

  if (!hasRecipient) {
    updatedContext.giftCollectionPhase = 'recipient';
  } else if (!hasOccasion) {
    updatedContext.giftCollectionPhase = 'occasion';
  } else if (!hasBudget) {
    updatedContext.giftCollectionPhase = 'budget';
  } else if (!hasPhone && updatedContext.selectedIntent === 'auto-gift') {
    updatedContext.giftCollectionPhase = 'payment';
  } else {
    updatedContext.giftCollectionPhase = 'confirmation';
  }

  // Add collection progress for better UX
  updatedContext.collectionProgress = {
    recipient: hasRecipient,
    occasion: hasOccasion,
    budget: hasBudget,
    phone: hasPhone || updatedContext.selectedIntent !== 'auto-gift'
  };

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
  const hasBasicInfo = !!(
    context.recipientInfo?.name &&
    context.occasion &&
    context.budget
  );
  
  // For auto-gift intent, also need phone number
  if (context.selectedIntent === 'auto-gift') {
    return hasBasicInfo && !!context.recipientInfo?.phone;
  }
  
  // For other intents, basic info is sufficient
  return hasBasicInfo;
}