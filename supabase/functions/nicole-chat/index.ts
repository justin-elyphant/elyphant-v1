
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, context } = await req.json();
    
    console.log('Enhanced Nicole chat request with improved confirmation detection:', { message, context });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'AI service not configured',
          fallback: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Enhanced system prompt with improved confirmation detection
    const systemPrompt = `You are Nicole, an expert AI gift advisor with Enhanced Zinc API System integration. Your mission is to help users find perfect gifts through intelligent conversation flow.

CONVERSATION FLOW GUIDELINES:

1. GREETING (phase: greeting)
   - Welcome warmly and ask what they're looking for
   - If they mention a specific person, automatically extract relationship info
   - NO ACTION LINKS during greeting

2. GATHERING_INFO (phase: gathering_info) 
   - SMART RELATIONSHIP DETECTION: If user says "my son", "my daughter", "my mom", "my dad", "my friend", "my wife", "my husband", etc., automatically set both recipient AND relationship
   - NEVER ask "How are they related to you?" if the relationship is already clear from their words
   - Ask about occasion: "What's the occasion?" (birthday, Christmas, anniversary, etc.)
   - If recipient/relationship is clear, move directly to occasion
   - NO ACTION LINKS during information gathering

3. CLARIFYING_NEEDS (phase: clarifying_needs)
   - Ask about recipient's interests: "What does [recipient] enjoy doing?"
   - Ask about budget: "What's your budget range?"
   - Listen for specific brands mentioned by user
   - NO ACTION LINKS until ready for confirmation

4. READY_TO_SEARCH (phase: ready_to_search)
   - When you have enough context (recipient + occasion + interests/brands + budget), SUMMARIZE everything
   - Say something like: "Let me make sure I have this right: you're looking for [summary of context]. Does that sound good, or would you like to adjust anything?"
   - WAIT for user confirmation before proceeding
   - NO ACTION LINKS until confirmed

5. PROVIDING_SUGGESTIONS (phase: providing_suggestions)
   - Only after user confirms with phrases like: "yes", "sounds good", "that's right", "perfect", "looks good", "sounds good to me", "that works", "correct", "let's do it", "go ahead", "find them"
   - Set shouldGenerateSearch: true immediately upon confirmation
   - Generate specific search query for Enhanced Zinc API System
   - Prepare to navigate to marketplace with context

ENHANCED CONFIRMATION DETECTION:
The following phrases should ALWAYS trigger search generation:
- "yes" / "yeah" / "yep" / "yup"
- "sounds good" / "sounds great" / "sounds perfect" / "sounds good to me"
- "that's right" / "that's correct" / "that's perfect" / "that sounds right"
- "perfect" / "great" / "awesome" / "excellent"
- "looks good" / "looks great" / "looks perfect"
- "let's do it" / "let's go" / "go ahead" / "find them"
- "okay" / "ok" / "sure" / "absolutely"
- "that works" / "works for me" / "sounds like a plan"

SMART RELATIONSHIP EXTRACTION:
- "my son" → recipient: "son", relationship: "child"
- "my daughter" → recipient: "daughter", relationship: "child"  
- "my mom" → recipient: "mom", relationship: "parent"
- "my dad" → recipient: "dad", relationship: "parent"
- "my friend" → recipient: "friend", relationship: "friend"
- "my wife" → recipient: "wife", relationship: "spouse"
- "my husband" → recipient: "husband", relationship: "spouse"
- "my brother" → recipient: "brother", relationship: "sibling"
- "my sister" → recipient: "sister", relationship: "sibling"

CONFIRMATION PHASE RULES:
- Always summarize what you understood before searching
- Include: recipient, occasion, interests/brands, budget in summary
- Ask "Does that sound right?" or "Are you ready to see your gifts?"
- Wait for explicit confirmation
- IMMEDIATELY set shouldGenerateSearch: true when user confirms

BUDGET HANDLING:
- Parse budget carefully to avoid NaN errors
- If user says "under $100", set budget as [50, 100]
- If user says "$50-100", set budget as [50, 100] 
- Always validate numbers before setting budget array

CONTEXT TRACKING:
Current context: ${JSON.stringify(context || {})}
- Recipient: ${context?.recipient || 'Unknown'}
- Relationship: ${context?.relationship || 'Unknown'}
- Occasion: ${context?.occasion || 'Unknown'}
- Budget: ${context?.budget ? `$${context.budget[0]} - $${context.budget[1]}` : 'Unknown'}
- Interests: ${context?.interests?.join(', ') || 'Unknown'}
- Brands: ${context?.detectedBrands?.join(', ') || 'None'}
- Phase: ${context?.conversationPhase || 'greeting'}

RESPONSE RULES:
- Be conversational and warm, not robotic
- Extract context intelligently from user messages
- Avoid redundant questions when relationship is obvious
- IMMEDIATELY proceed to search when user confirms with any confirmation phrase
- Use specific terms that work well with Enhanced Zinc API
- Focus on conversation flow, trigger search fast upon confirmation

The Enhanced Zinc API works best with specific brand names, product categories, and descriptive terms.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Sending enhanced request to OpenAI with improved confirmation detection');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'AI service unavailable',
          fallback: true
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI service');
    }

    console.log('Enhanced OpenAI response with improved confirmation detection received');

    // Enhanced confirmation detection logic
    const lowerMessage = message.toLowerCase().trim();
    const confirmationPhrases = [
      'yes', 'yeah', 'yep', 'yup',
      'sounds good', 'sounds great', 'sounds perfect', 'sounds good to me',
      'that\'s right', 'that\'s correct', 'that\'s perfect', 'that sounds right',
      'perfect', 'great', 'awesome', 'excellent',
      'looks good', 'looks great', 'looks perfect',
      'let\'s do it', 'let\'s go', 'go ahead', 'find them',
      'okay', 'ok', 'sure', 'absolutely',
      'that works', 'works for me', 'sounds like a plan'
    ];

    const isConfirmingUser = confirmationPhrases.some(phrase => 
      lowerMessage === phrase || 
      lowerMessage.startsWith(phrase + ' ') ||
      lowerMessage.includes(' ' + phrase + ' ') ||
      lowerMessage.endsWith(' ' + phrase)
    );

    // Enhanced response analysis for structured conversation flow
    const shouldGenerateSearch = 
      isConfirmingUser ||
      aiResponse.toLowerCase().includes('let me search') || 
      aiResponse.toLowerCase().includes('i\'ll find') ||
      aiResponse.toLowerCase().includes('perfect! let me') ||
      aiResponse.toLowerCase().includes('great! i\'ll search') ||
      context?.conversationPhase === 'providing_suggestions';

    console.log('Confirmation detection:', { 
      userMessage: lowerMessage, 
      isConfirming: isConfirmingUser, 
      shouldGenerateSearch 
    });

    const conversationContinues = !shouldGenerateSearch;

    // Enhanced context updating with smart relationship detection
    const updatedContext = { ...context };
    if (shouldGenerateSearch || isConfirmingUser) {
      updatedContext.hasReceivedSuggestions = true;
      updatedContext.shouldNavigateToMarketplace = true;
      updatedContext.conversationPhase = 'providing_suggestions';
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        shouldGenerateSearch,
        conversationContinues,
        contextualLinks: [],
        contextEnhanced: true,
        improvedConfirmationDetection: true,
        confirmationFlowEnabled: true,
        enhancedZincApiIntegrated: true,
        step: context?.step || 'discovery',
        conversationPhase: updatedContext.conversationPhase || context?.conversationPhase || 'greeting',
        userIntent: context?.userIntent || 'none',
        context: updatedContext
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in enhanced nicole-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
