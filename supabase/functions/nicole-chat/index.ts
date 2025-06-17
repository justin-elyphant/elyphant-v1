
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { message, conversationHistory, context } = await req.json();
    
    console.log('Enhanced Nicole chat request:', { message, context });

    // Get OpenAI API key from environment
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

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Enhanced system prompt that understands the Enhanced Zinc API System
    const systemPrompt = `You are Nicole, an enhanced AI gift shopping assistant with access to the Enhanced Zinc API System and user data. Your goal is to help users find perfect gifts by leveraging advanced product search capabilities, social connections, and recipients' actual wishlists.

Key capabilities:
- You have access to the Enhanced Zinc API System that can search for specific products like "Dallas Cowboys merchandise", "Made In kitchen gear", "Nike shoes", etc.
- You can see recipients' actual wishlist items and preferences
- You prioritize gifts from recipients' wishlists when available
- You understand relationships, occasions, and budgets
- You generate intelligent search queries that work with the enhanced product search system
- You're conversational, helpful, and make thoughtful recommendations

Enhanced Search Integration:
- When generating search queries, use specific brand names, product categories, and descriptive terms
- Examples of effective search queries: "Dallas Cowboys jersey", "Made In cookware set", "Nike running shoes", "Apple iPhone", "Samsung Galaxy"
- The Enhanced Zinc API System can handle specific brand and product searches much better than generic terms

Current conversation context: ${JSON.stringify(context || {})}

Guidelines:
- Always prioritize items from the recipient's actual wishlist when they match the budget and occasion
- Generate specific, detailed search queries that will work well with the Enhanced Zinc API System
- Reference the recipient by name when you know it
- Consider the relationship type when making suggestions
- Be specific about why you're recommending certain items
- Ask clarifying questions to better understand preferences
- Keep responses concise but warm and helpful

Available context data:
- Recipient: ${context?.recipient || 'Not specified'}
- Relationship: ${context?.relationship || 'Not specified'}
- Occasion: ${context?.occasion || 'Not specified'}
- Budget: ${context?.budget ? `$${context.budget[0]} - $${context.budget[1]}` : 'Not specified'}
- Connections: ${context?.connections?.length || 0} people
- Wishlist items available: ${context?.recipientWishlists?.length || 0} wishlists
- Recommendations: ${context?.recommendations?.length || 0} prioritized items`;

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Sending enhanced request to OpenAI with Enhanced Zinc API context');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 400,
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

    console.log('Enhanced OpenAI response with Zinc API integration received');

    // Enhanced response analysis that understands the Enhanced Zinc API System
    const shouldGenerateSearch = 
      aiResponse.toLowerCase().includes('search') || 
      aiResponse.toLowerCase().includes('find') ||
      aiResponse.toLowerCase().includes('look for') ||
      aiResponse.toLowerCase().includes('dallas cowboys') ||
      aiResponse.toLowerCase().includes('made in') ||
      aiResponse.toLowerCase().includes('nike') ||
      (context?.recipient && context?.occasion && context?.budget) ||
      context?.step === 'ready_to_search';

    // Check if we should show wishlist items
    const shouldShowWishlist = 
      context?.recipientWishlists && 
      context.recipientWishlists.length > 0 &&
      context?.budget &&
      aiResponse.toLowerCase().includes('wishlist');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        shouldGenerateSearch,
        conversationContinues: !shouldGenerateSearch,
        shouldShowWishlist: shouldShowWishlist,
        contextEnhanced: true,
        enhancedZincApiIntegrated: true
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
