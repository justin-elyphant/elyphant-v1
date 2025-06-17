
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextualLink {
  text: string;
  url: string;
  type: 'wishlist' | 'schedule' | 'profile' | 'connections';
}

const generateContextualLinks = (context: any, aiResponse: string): ContextualLink[] => {
  const links: ContextualLink[] = [];
  const lowerResponse = aiResponse.toLowerCase();
  const lowerMessage = context.lastMessage?.toLowerCase() || '';

  // Post-search context - offer wishlist creation
  if (context.shouldGenerateSearch || lowerResponse.includes('found') || lowerResponse.includes('recommendations')) {
    if (context.recipient) {
      links.push({
        text: `Add these to a wishlist for ${context.recipient}`,
        url: `/wishlists/create?recipient=${encodeURIComponent(context.recipient)}&occasion=${encodeURIComponent(context.occasion || '')}`,
        type: 'wishlist'
      });
    } else {
      links.push({
        text: "Save these items to a wishlist",
        url: `/wishlists/create`,
        type: 'wishlist'
      });
    }
  }

  // Gift scheduling context
  if ((lowerResponse.includes('schedule') || lowerResponse.includes('recurring') || lowerResponse.includes('remind')) && context.recipient && context.occasion) {
    links.push({
      text: `Schedule recurring gifts for ${context.recipient}`,
      url: `/gift-scheduling/create?recipient=${encodeURIComponent(context.recipient)}&occasion=${encodeURIComponent(context.occasion)}`,
      type: 'schedule'
    });
  }

  // Friend/connection context
  if ((lowerResponse.includes('friend') || lowerResponse.includes('connect') || lowerMessage.includes('friend')) && !context.selectedFriend) {
    links.push({
      text: "Browse your friends' wishlists",
      url: `/connections?intent=gift-giving`,
      type: 'connections'
    });
  }

  // Budget/multiple gifts context
  if (lowerResponse.includes('budget') || lowerResponse.includes('multiple') || lowerResponse.includes('more gifts')) {
    links.push({
      text: "Set up automated gift scheduling",
      url: `/gift-scheduling?setup=auto`,
      type: 'schedule'
    });
  }

  return links;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, context } = await req.json();
    
    console.log('Enhanced Nicole chat request with contextual linking:', { message, context });

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

    // Enhanced system prompt with contextual linking awareness
    const systemPrompt = `You are Nicole, an expert AI gift advisor with access to the Enhanced Zinc API System. Your mission is to help users find perfect gifts through structured conversation flow and provide helpful next steps.

CONVERSATION FLOW GUIDELINES:
1. GREETING (step: greeting)
   - Welcome warmly and ask what they're looking for
   - If they mention a specific person, move to step 2

2. DISCOVERY (step: discovery) 
   - Ask about the recipient: "Who are you shopping for?"
   - Ask about relationship: "How are they related to you?" (mom, dad, friend, spouse, etc.)
   - Ask about occasion: "What's the occasion?" (birthday, Christmas, anniversary, etc.)
   - Move to step 3 when you have recipient + occasion

3. PREFERENCES (step: preferences)
   - Ask about recipient's interests: "What does [recipient] enjoy doing?"
   - Ask about budget: "What's your budget range?"
   - Ask about any specific preferences or restrictions
   - Move to step 4 when you have enough context

4. SEARCH_READY (step: search_ready)
   - Confirm you have enough information
   - Generate a specific search query for the Enhanced Zinc API System
   - Set shouldGenerateSearch: true

CONTEXTUAL ASSISTANCE:
When appropriate, naturally suggest helpful next steps:
- After finding products: "Would you like to save these to a wishlist?"
- When discussing recurring occasions: "Want to schedule this as a recurring gift?"
- When mentioning friends/family: "Would you like to see what they're interested in?"
- For budget discussions: "Ready to set up automated gift giving?"

CONTEXT TRACKING:
Current context: ${JSON.stringify(context || {})}
- Recipient: ${context?.recipient || 'Unknown'}
- Relationship: ${context?.relationship || 'Unknown'}
- Occasion: ${context?.occasion || 'Unknown'}
- Budget: ${context?.budget ? `$${context.budget[0]} - $${context.budget[1]}` : 'Unknown'}
- Interests: ${context?.interests?.join(', ') || 'Unknown'}
- Step: ${context?.step || 'greeting'}

RESPONSE RULES:
- Always ask ONE clear follow-up question to move the conversation forward
- Be conversational and warm, not robotic
- Extract context from user messages (recipient type, occasions, budget, interests)
- When you have recipient + occasion + some preferences, suggest generating search
- Use specific product terms that work well with Enhanced Zinc API (brand names, categories)
- Keep responses concise but engaging
- Naturally weave in helpful suggestions for next steps when contextually appropriate

The Enhanced Zinc API works best with specific brand names, product categories, and descriptive terms.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Sending enhanced request to OpenAI with contextual linking capabilities');

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

    console.log('Enhanced OpenAI response with contextual linking received');

    // Enhanced context for link generation
    const enhancedContext = {
      ...context,
      lastMessage: message,
      conversationLength: (conversationHistory || []).length
    };

    // Generate contextual links based on conversation context and AI response
    const contextualLinks = generateContextualLinks(enhancedContext, aiResponse);

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

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        shouldGenerateSearch,
        conversationContinues,
        contextualLinks,
        contextEnhanced: true,
        enhancedZincApiIntegrated: true,
        step: context?.step || 'discovery'
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
