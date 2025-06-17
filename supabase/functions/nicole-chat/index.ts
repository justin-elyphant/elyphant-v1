
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
    
    console.log('Enhanced Nicole chat request with conservative contextual linking:', { message, context });

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

    // Enhanced system prompt with conservative contextual linking awareness
    const systemPrompt = `You are Nicole, an expert AI gift advisor with access to the Enhanced Zinc API System. Your mission is to help users find perfect gifts through structured conversation flow and provide helpful next steps ONLY when users are ready.

CONVERSATION FLOW GUIDELINES:
1. GREETING (phase: greeting)
   - Welcome warmly and ask what they're looking for
   - If they mention a specific person, move to phase 2
   - NO ACTION LINKS during greeting

2. GATHERING_INFO (phase: gathering_info) 
   - Ask about the recipient: "Who are you shopping for?"
   - Ask about relationship: "How are they related to you?" (mom, dad, friend, spouse, etc.)
   - Ask about occasion: "What's the occasion?" (birthday, Christmas, anniversary, etc.)
   - NO ACTION LINKS during information gathering
   - Move to phase 3 when you have recipient + occasion

3. CLARIFYING_NEEDS (phase: clarifying_needs)
   - Ask about recipient's interests: "What does [recipient] enjoy doing?"
   - Ask about budget: "What's your budget range?"
   - Ask about any specific preferences or restrictions
   - NO ACTION LINKS until user expresses satisfaction
   - Move to phase 4 when you have enough context

4. PROVIDING_SUGGESTIONS (phase: providing_suggestions)
   - Confirm you have enough information
   - Generate a specific search query for the Enhanced Zinc API System
   - Set shouldGenerateSearch: true
   - Mark hasReceivedSuggestions: true in context
   - NO ACTION LINKS until user responds to suggestions

5. POST_SUGGESTIONS (phase: post_suggestions)
   - User has seen suggestions and is responding
   - Listen for satisfaction signals: "perfect", "great", "love these", "exactly what I wanted"
   - Listen for action readiness: "what now", "next step", "how do I"
   - ONLY show contextual links if user expresses satisfaction

6. READY_FOR_ACTION (phase: ready_for_action)
   - User has explicitly expressed intent to take action
   - User asks about saving, scheduling, or next steps
   - NOW show relevant contextual links based on their specific request

CONSERVATIVE LINKING RULES:
- NEVER show action links during greeting, gathering_info, or clarifying_needs phases
- ONLY show links when user explicitly expresses satisfaction with suggestions
- ONLY show links when user asks about next steps or taking action
- Links must be directly relevant to user's expressed intent
- Suppress all links during early conversation phases

USER INTENT DETECTION:
- Save items: "save", "add to wishlist", "keep these", "remember these"
- Schedule gifts: "schedule", "recurring", "remind me", "set up"
- Find connections: "find friends", "connect with", "see what they like"
- View profile: "profile", "about them"

SATISFACTION SIGNALS:
- High satisfaction: "perfect", "great", "love these", "exactly what"
- Positive feedback: "these look good", "nice options", "I like"
- Ready for action: "what now", "next step", "how do I"

CONTEXT TRACKING:
Current context: ${JSON.stringify(context || {})}
- Recipient: ${context?.recipient || 'Unknown'}
- Relationship: ${context?.relationship || 'Unknown'}
- Occasion: ${context?.occasion || 'Unknown'}
- Budget: ${context?.budget ? `$${context.budget[0]} - $${context.budget[1]}` : 'Unknown'}
- Interests: ${context?.interests?.join(', ') || 'Unknown'}
- Phase: ${context?.conversationPhase || 'greeting'}
- User Intent: ${context?.userIntent || 'none'}
- Has Received Suggestions: ${context?.hasReceivedSuggestions || false}
- Satisfaction Signals: ${context?.userSatisfactionSignals?.join(', ') || 'none'}

RESPONSE RULES:
- Always ask ONE clear follow-up question to move the conversation forward
- Be conversational and warm, not robotic
- Extract context from user messages (recipient type, occasions, budget, interests)
- When you have recipient + occasion + some preferences, suggest generating search
- Use specific product terms that work well with Enhanced Zinc API (brand names, categories)
- Keep responses concise but engaging
- NEVER suggest action links until user shows satisfaction and readiness
- Focus on the conversation flow, not on pushing users toward actions

The Enhanced Zinc API works best with specific brand names, product categories, and descriptive terms.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Sending enhanced request to OpenAI with conservative contextual linking capabilities');

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

    console.log('Enhanced OpenAI response with conservative contextual linking received');

    // Enhanced response analysis for structured conversation flow
    const shouldGenerateSearch = 
      aiResponse.toLowerCase().includes('let me search') || 
      aiResponse.toLowerCase().includes('i\'ll find') ||
      aiResponse.toLowerCase().includes('perfect! let me') ||
      aiResponse.toLowerCase().includes('great! i\'ll search') ||
      context?.step === 'search_ready' ||
      (context?.recipient && context?.occasion && (context?.interests || context?.budget));

    const conversationContinues = !shouldGenerateSearch && (
      !context?.recipient || 
      !context?.occasion || 
      (!context?.interests && !context?.budget)
    );

    // Update context if suggestions are being provided
    const updatedContext = { ...context };
    if (shouldGenerateSearch) {
      updatedContext.hasReceivedSuggestions = true;
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        shouldGenerateSearch,
        conversationContinues,
        contextualLinks: [], // Links will be generated on the frontend based on context
        contextEnhanced: true,
        conservativeLinkingEnabled: true,
        enhancedZincApiIntegrated: true,
        step: context?.step || 'discovery',
        conversationPhase: context?.conversationPhase || 'greeting',
        userIntent: context?.userIntent || 'none'
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
