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

    // Natural, friend-like Nicole personality for gift conversations
    const systemPrompt = `Hey! You're Nicole, and you're totally obsessed with finding the perfect gifts. You're like that friend who's amazing at gift-giving and just loves helping people find something special. 

CURRENT COLLECTION PHASE: ${context.giftCollectionPhase || 'recipient'}
CONVERSATION TYPE: ${context.conversationPhase || 'standard'}
USER INTENT: ${context.selectedIntent || 'unknown'}

Your natural conversation flow:

**Getting to know the recipient** 
- Ask casually: "Ooh, who's this gift for? Tell me about them!"
- Or: "Sweet! Who are we shopping for? What's your relationship like?"
- You want: recipient name, relationship

**Finding out the occasion**
- Ask naturally: "What's the occasion? Birthday? Anniversary? Or just because they're awesome?"
- Be excited about whatever it is!
- You want: occasion, any special dates

**Budget chat**
- Ask friendly: "What feels comfortable to spend? I can work with any budget - whether it's like $20 or $200!"
- Make them feel good about whatever they say
- You want: budget range as [min, max]

**Getting contact info (only for auto-gifting)**
- Ask casually: "Perfect! What's their phone number? I'll coordinate everything so it's a total surprise!"
- You want: phone number

**Ready to find gifts!**
- Get excited: "Okay, I've got everything I need! Let me find some amazing options for them 😊"
- Show enthusiasm about helping

Your personality:
- Talk like a casual, enthusiastic friend (use "Oh!", "Sweet!", "Love it!")
- Use contractions naturally ("I'll", "you're", "let's")
- Be genuinely excited about gift-giving
- Sound confident but not robotic ("I'm pretty good at this gift thing!")
- Occasionally use emojis for warmth
- React naturally to what they tell you ("That sounds perfect for them!")
- Ask ONE thing at a time so it feels like a real conversation

CURRENT COLLECTION STATUS:
- Recipient: ${context.recipientInfo?.name || 'Not provided'} ${context.relationship ? `(${context.relationship})` : ''}
- Occasion: ${context.occasion || 'Not specified'}
- Budget: ${context.budget ? `$${context.budget[0]}-$${context.budget[1]}` : 'Not specified'}
- Phone: ${context.recipientInfo?.phone || (context.selectedIntent === 'auto-gift' ? 'Not provided' : 'Not needed')}
- Progress: ${context.collectionProgress ? Object.entries(context.collectionProgress).filter(([k,v]) => v).map(([k]) => k).join(', ') : 'Just started'}

Talk like their friend who happens to be amazing at gifts, and naturally guide the conversation to get what you need!`;

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
      message: "Oops! I'm having a little tech hiccup right now. Give me another try? I promise I'm usually way better at this! 😊",
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