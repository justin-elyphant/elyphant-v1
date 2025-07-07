
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
    const { message, conversationHistory, context, enhancedFeatures } = await req.json();
    
    console.log('Enhanced Nicole chat request with CTA button system:', { 
      message, 
      context, 
      enhancedFeatures,
      hasConnections: Boolean(context?.userConnections),
      hasWishlists: Boolean(context?.userWishlists)
    });

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

    // Enhanced budget parsing function
    const parseBudgetFromMessage = (message: string, currentContext: any) => {
      const lowerMessage = message.toLowerCase();
      let budget = currentContext?.budget;
      
      // Enhanced budget patterns
      const budgetPatterns = [
        // "no more than $300", "under $300", "up to $300"
        { pattern: /(?:no more than|under|up to|maximum|max)\s*\$?(\d+)/i, type: 'max' },
        // "$100-200", "$100 to $200", "$100-$200"
        { pattern: /\$?(\d+)\s*(?:-|to)\s*\$?(\d+)/i, type: 'range' },
        // "around $150", "about $150"
        { pattern: /(?:around|about|roughly)\s*\$?(\d+)/i, type: 'around' },
        // "$50 budget", "budget of $50"
        { pattern: /(?:budget.*?\$?(\d+)|\$?(\d+).*?budget)/i, type: 'exact' }
      ];

      for (const { pattern, type } of budgetPatterns) {
        const match = message.match(pattern);
        if (match) {
          if (type === 'max') {
            const maxAmount = parseInt(match[1]);
            if (!isNaN(maxAmount) && maxAmount > 0) {
              const minAmount = Math.max(10, Math.floor(maxAmount * 0.5));
              budget = [minAmount, maxAmount];
              console.log(`Budget parsed (max): ${budget}`);
              break;
            }
          } else if (type === 'range') {
            const min = parseInt(match[1]);
            const max = parseInt(match[2]);
            if (!isNaN(min) && !isNaN(max) && min > 0 && max > min) {
              budget = [min, max];
              console.log(`Budget parsed (range): ${budget}`);
              break;
            }
          } else if (type === 'around') {
            const amount = parseInt(match[1]);
            if (!isNaN(amount) && amount > 0) {
              const min = Math.max(10, Math.floor(amount * 0.7));
              const max = Math.ceil(amount * 1.3);
              budget = [min, max];
              console.log(`Budget parsed (around): ${budget}`);
              break;
            }
          } else if (type === 'exact') {
            const amount = parseInt(match[1] || match[2]);
            if (!isNaN(amount) && amount > 0) {
              const min = Math.max(10, Math.floor(amount * 0.8));
              const max = Math.ceil(amount * 1.2);
              budget = [min, max];
              console.log(`Budget parsed (exact): ${budget}`);
              break;
            }
          }
        }
      }

      return budget;
    };

    // Enhanced system prompt with connection and wishlist integration
    let systemPrompt = `You are Nicole, an expert AI gift advisor with Enhanced Zinc API System integration. Your mission is to help users find perfect gifts through intelligent conversation flow with a streamlined CTA button experience.

ENHANCED WEEK 2 CAPABILITIES:
- Connection Integration: Access to user's friends/family for personalized recommendations
- Wishlist Integration: Reference user's saved items and preferences
- Real-time Data: Current user connections and wishlist insights
- Marketplace Integration: Direct connection to Enhanced Zinc API System

CURRENT USER DATA:
${context?.userConnections ? `- Connections: ${context.userConnections.length} friends/family members` : '- No connection data available'}
${context?.userWishlists ? `- Wishlists: ${context.userWishlists.length} saved lists with items` : '- No wishlist data available'}

CONVERSATION FLOW GUIDELINES:

1. GREETING (phase: greeting)
   - Welcome warmly and ask what they're looking for
   - If they mention a specific person, automatically extract relationship info
   - NO CTA BUTTON during greeting

2. GATHERING_INFO (phase: gathering_info) 
   - SMART RELATIONSHIP DETECTION: If user says "my son", "my daughter", "my mom", "my dad", "my friend", "my wife", "my husband", etc., automatically set both recipient AND relationship
   - NEVER ask "How are they related to you?" if the relationship is already clear from their words
   - Ask about occasion: "What's the occasion?" (birthday, Christmas, anniversary, etc.)
   - If recipient/relationship is clear, move directly to occasion
   - NO CTA BUTTON during information gathering

3. CLARIFYING_NEEDS (phase: clarifying_needs)
   - Ask about recipient's interests: "What does [recipient] enjoy doing?"
   - Ask about budget: "What's your budget range?"
   - Listen for specific brands mentioned by user
   - NO CTA BUTTON until ready for search

4. READY_FOR_SEARCH_BUTTON (phase: ready_for_search_button)
   - When you have enough context (recipient + (occasion OR age) + interests + budget), SUMMARIZE everything clearly
   - Say something like: "Perfect! Let me summarize what I understand: you're looking for [summary of all context]. I'm ready to find the perfect gifts for you!"
   - SET showSearchButton: true to display the CTA button
   - DO NOT ask for confirmation - the button handles that

5. GENERATING_SEARCH (phase: generating_search)
   - Only reached when user clicks the "Ready to See Gifts" button
   - Immediately generate Enhanced Zinc API search query
   - Navigate to marketplace with context

FLEXIBLE CONTEXT REQUIREMENTS:
- MINIMUM REQUIRED: recipient + (interests OR age/occasion) + budget
- Age detection: "turning 60", "60th birthday", "he's turning 60" = age context
- Budget detection: "no more than $100", "under $100", "up to $100" = budget context
- Interest detection: "Dallas Cowboys", "golf", "cooking BBQ" = interests context

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

CTA BUTTON LOGIC:
- Show the search button when you have sufficient context for Enhanced Zinc API
- Required context: recipient + (occasion OR exactAge) + (interests OR detectedBrands) + budget
- When ready, set showSearchButton: true and provide clear summary
- The button will handle the actual search generation and navigation

BUDGET HANDLING:
- Parse budget carefully to avoid NaN errors
- If user says "under $100", "no more than $100", "up to $100", set budget as [50, 100]
- If user says "$50-100", set budget as [50, 100] 
- Always validate numbers before setting budget array

CONTEXT TRACKING:
Current context: ${JSON.stringify(context || {})}
- Recipient: ${context?.recipient || 'Unknown'}
- Relationship: ${context?.relationship || 'Unknown'}
- Occasion: ${context?.occasion || 'Unknown'}
- Exact Age: ${context?.exactAge || 'Unknown'}
- Budget: ${context?.budget ? `$${context.budget[0]} - $${context.budget[1]}` : 'Unknown'}
- Interests: ${context?.interests?.join(', ') || 'Unknown'}
- Brands: ${context?.detectedBrands?.join(', ') || 'None'}
- Phase: ${context?.conversationPhase || 'greeting'}

ENHANCED INTEGRATION FEATURES:
- Connection Integration: ${Boolean(context?.userConnections) ? 'Active' : 'Inactive'}
- Wishlist Integration: ${Boolean(context?.userWishlists) ? 'Active' : 'Inactive'}

RESPONSE RULES:
- Be conversational and warm, not robotic
- Extract context intelligently from user messages
- Avoid redundant questions when relationship is obvious
- SHOW THE CTA BUTTON when you have sufficient context for Enhanced Zinc API search
- Use specific terms that work well with Enhanced Zinc API
- Focus on conversation flow, trigger CTA button when ready

The Enhanced Zinc API works best with specific brand names, product categories, and descriptive terms.`;

    // Enhanced: Add connection and wishlist context to system prompt
    if (context?.userConnections && context.userConnections.length > 0) {
      systemPrompt += `\n\nUSER'S CONNECTIONS:
${context.userConnections.map((conn: any, i: number) => 
  `${i + 1}. ${conn.profiles?.name || 'Unknown'} (${conn.relationship_type})`
).join('\n')}

When appropriate, you can suggest gifts for these specific people or ask if they're shopping for any of them.`;
    }

    if (context?.userWishlists && context.userWishlists.length > 0) {
      systemPrompt += `\n\nUSER'S WISHLIST INSIGHTS:
${context.userWishlists.map((list: any, i: number) => 
  `${i + 1}. "${list.title}" (${list.category || 'General'}) - ${list.wishlist_items?.length || 0} items`
).join('\n')}

You can reference their taste preferences based on their saved items when making recommendations.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Sending Enhanced Zinc API request to OpenAI with CTA button system');

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

    console.log('Enhanced Zinc API OpenAI response with CTA button system received');

    // Parse budget from the current message
    const updatedBudget = parseBudgetFromMessage(message, context);

    // Enhanced context parsing with budget
    const enhancedContext = {
      ...context,
      budget: updatedBudget || context?.budget
    };

    // More flexible CTA button logic - check for minimum viable context
    const hasRecipient = Boolean(enhancedContext?.recipient);
    const hasOccasionOrAge = Boolean(enhancedContext?.occasion || enhancedContext?.exactAge);
    const hasInterestsOrBrands = Boolean(
      (enhancedContext?.interests && enhancedContext.interests.length > 0) || 
      (enhancedContext?.detectedBrands && enhancedContext.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(enhancedContext?.budget && Array.isArray(enhancedContext.budget) && enhancedContext.budget.length === 2);

    const hasMinimumContext = hasRecipient && hasOccasionOrAge && hasInterestsOrBrands && hasBudget;

    // Check if AI response indicates readiness for search
    const aiIndicatesReady = 
      aiResponse.toLowerCase().includes('perfect!') ||
      aiResponse.toLowerCase().includes('ready to find') ||
      aiResponse.toLowerCase().includes('let me summarize') ||
      (hasMinimumContext && aiResponse.toLowerCase().includes('understand'));

    const showSearchButton = hasMinimumContext && aiIndicatesReady;

    console.log('CTA Button Logic:', { 
      hasRecipient,
      hasOccasionOrAge, 
      hasInterestsOrBrands,
      hasBudget,
      hasMinimumContext,
      aiIndicatesReady, 
      showSearchButton,
      context: {
        recipient: enhancedContext?.recipient,
        occasion: enhancedContext?.occasion,
        exactAge: enhancedContext?.exactAge,
        interests: enhancedContext?.interests,
        brands: enhancedContext?.detectedBrands,
        budget: enhancedContext?.budget
      }
    });

    // Update context with Enhanced Zinc API preservation
    const updatedContext = { 
      ...enhancedContext,
      conversationPhase: showSearchButton ? 'ready_for_search_button' : enhancedContext?.conversationPhase || 'gathering_info'
    };

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        message: aiResponse,
        showSearchButton,
        conversationContinues: !showSearchButton,
        contextualLinks: [],
        contextEnhanced: true,
        ctaButtonSystem: true,
        enhancedZincApiIntegrated: true,
        step: enhancedContext?.step || 'discovery',
        conversationPhase: updatedContext.conversationPhase,
        userIntent: enhancedContext?.userIntent || 'none',
        context: updatedContext,
        // Enhanced Week 2 features
        enhancedFeatures: {
          connectionIntegration: Boolean(context?.userConnections),
          wishlistIntegration: Boolean(context?.userWishlists),
          realTimeData: true,
          marketplaceIntegration: true
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in Enhanced Zinc API nicole-chat function with CTA button:', error);
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
