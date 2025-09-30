import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context = {}, sessionId, userId } = await req.json();
    
    console.log('🤖 Nicole Unified Agent:', { message, context, sessionId, userId });

    // Validate required environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase for user profile lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile for personalization
    let userProfile = null;
    let isAuthenticated = false;
    
    if (userId || context.currentUserId) {
      isAuthenticated = true;
      const currentUserId = userId || context.currentUserId;
      
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, username, first_name')
          .eq('id', currentUserId)
          .single();
        
        if (profileData) {
          userProfile = profileData;
          console.log('✅ User profile loaded:', { name: profileData.name, firstName: profileData.first_name });
        }
      } catch (error) {
        console.error('❌ Error loading user profile:', error);
      }
    }

    // Build comprehensive system prompt
    const systemPrompt = buildNicoleSystemPrompt({
      isAuthenticated,
      userProfile,
      context
    });

    // Handle dynamic greeting or regular conversation
    const actualMessage = message === '__START_DYNAMIC_CHAT__' 
      ? buildDynamicGreeting({ isAuthenticated, userProfile, context })
      : message;

    console.log('🎯 Sending to OpenAI with auth status:', isAuthenticated);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: actualMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_auto_gift_opportunity',
              description: 'Detect when the conversation suggests an auto-gifting setup opportunity',
              parameters: {
                type: 'object',
                properties: {
                  recipient_name: { type: 'string', description: 'Name of the gift recipient' },
                  occasion: { type: 'string', description: 'Type of occasion (birthday, anniversary, etc.)' },
                  suggested_budget: { type: 'array', items: { type: 'number' }, description: 'Suggested budget range [min, max]' },
                  confidence: { type: 'number', description: 'Confidence score 0-1' },
                  cta_text: { type: 'string', description: 'Suggested CTA button text' }
                },
                required: ['recipient_name', 'occasion', 'confidence', 'cta_text']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    const data = await response.json();
    
    if (!data.choices?.[0]) {
      throw new Error('Invalid OpenAI response');
    }

    const choice = data.choices[0];
    const aiMessage = choice.message.content;
    
    // Extract CTA information from tool calls
    let ctaButtons = [];
    if (choice.message.tool_calls?.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === 'detect_auto_gift_opportunity') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            ctaButtons.push({
              id: `auto-gift-${Date.now()}`,
              text: args.cta_text,
              action: 'setup_auto_gift',
              data: {
                recipientName: args.recipient_name,
                occasion: args.occasion,
                suggestedBudget: args.suggested_budget,
                confidence: args.confidence
              }
            });
          } catch (error) {
            console.error('Error parsing tool call arguments:', error);
          }
        }
      }
    }

    // Analyze conversation for context updates
    const updatedContext = analyzeAndUpdateContext(aiMessage, actualMessage, context);

    return new Response(JSON.stringify({
      message: aiMessage,
      context: updatedContext,
      capability: determineCapability(updatedContext),
      ctaButtons,
      actions: determineActions(updatedContext),
      showSearchButton: isReadyForSearch(updatedContext),
      metadata: {
        isAuthenticated,
        hasProfile: !!userProfile,
        contextUpdates: Object.keys(updatedContext).length,
        agentModel: 'simplified'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Nicole Unified Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "I'm having a moment here! Mind giving me another try?",
      context: {},
      capability: 'conversation',
      ctaButtons: [],
      actions: [],
      showSearchButton: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function buildNicoleSystemPrompt({ isAuthenticated, userProfile, context }: any): string {
  const userName = userProfile?.first_name || userProfile?.name || (isAuthenticated ? 'there' : null);
  
  return `You are Nicole, an AI gift discovery assistant for Elyphant. You're knowledgeable, helpful, and naturally conversational.

**Authentication Status:** ${isAuthenticated ? 'Authenticated' : 'Guest'} user
${userName ? `**User Name:** ${userName}` : ''}

**Your Personality:**
- Friendly and approachable, like a knowledgeable store associate
- Natural conversation style - no excessive exclamation points or "Ooh!" starts
- Helpful and patient, especially with first-time users
- Focus on understanding their needs before diving into solutions

**Greeting Guidelines:**
${isAuthenticated ? 
  `- When asked for a greeting, respond with exactly: "Hi ${userName}! How can I help you find the perfect gift today?"
  - Use this exact format for consistency` :
  `- For new visitors: "Hi there! I'm Nicole, your AI gifting assistant. How can I help you find the perfect gift today?"
  - Welcome them to Elyphant and explain how you can help`
}

**Auto-Gifting Detection:**
When users mention:
- Setting up gifts for birthdays, anniversaries, or special occasions
- Wanting to "never forget" someone's special day
- Automating gift-giving for family/friends
- Managing multiple people's gift needs

Use the detect_auto_gift_opportunity tool to suggest setting up auto-gifting with a natural CTA button.

**Conversation Flow:**
1. Understand their gift-giving need or question
2. Ask clarifying questions naturally (one at a time)
3. Provide helpful suggestions or information
4. Detect opportunities for auto-gifting when relevant
5. Guide toward gift search when they have enough details

**Current Context:**
${Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : 'Starting fresh conversation'}

Stay natural, helpful, and focused on their gift-giving needs.`;
}

function buildDynamicGreeting({ isAuthenticated, userProfile, context }: any): string {
  if (!isAuthenticated) {
    return "I'd like to learn about Elyphant's gifting features";
  }
  
  const userName = userProfile?.first_name || userProfile?.name || 'there';
  
  // Always return the same consistent greeting format for authenticated users
  return `Please respond with exactly: "Hi ${userName}! How can I help you find the perfect gift today?"`;
}

function analyzeAndUpdateContext(aiMessage: string, userMessage: string, currentContext: any): any {
  const updatedContext = { ...currentContext };
  const lowerUserMessage = userMessage.toLowerCase();
  
  // Extract recipient name
  if (!updatedContext.recipient) {
    const recipientMatch = userMessage.match(/(?:for|gift for|giving to)\s+([A-Za-z\s]+)/i);
    if (recipientMatch) {
      updatedContext.recipient = recipientMatch[1].trim();
    }
  }
  
  // Extract occasion
  const occasions = ['birthday', 'christmas', 'anniversary', 'graduation', 'wedding', 'holiday'];
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
    const budgetMatch = userMessage.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?/);
    if (budgetMatch) {
      const min = parseInt(budgetMatch[1]);
      const max = budgetMatch[2] ? parseInt(budgetMatch[2]) : min + 30;
      updatedContext.budget = [min, max];
    }
  }
  
  return updatedContext;
}

function determineCapability(context: any): string {
  if (context.recipient && context.occasion && context.budget) {
    return 'gift_advisor';
  }
  if (context.recipient || context.occasion) {
    return 'gift_discovery';
  }
  return 'conversation';
}

function determineActions(context: any): string[] {
  const actions = ['continue_conversation'];
  
  if (context.recipient) {
    actions.push('analyze_preferences');
  }
  
  if (isReadyForSearch(context)) {
    actions.push('start_search');
  }
  
  return actions;
}

function isReadyForSearch(context: any): boolean {
  return !!(context.recipient && context.occasion && context.budget);
}