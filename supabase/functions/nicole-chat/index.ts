
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
    
    console.log('Enhanced Nicole chat request with CTA button system:', { message, context });

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

    // Enhanced system prompt with CTA button logic and Enhanced Zinc API System integration
    const systemPrompt = `You are Nicole, an expert AI gift advisor with Enhanced Zinc API System integration. Your mission is to help users find perfect gifts through intelligent conversation flow with a streamlined CTA button experience.

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
   - When you have enough context (recipient + occasion + interests/brands + budget), SUMMARIZE everything clearly
   - Say something like: "Perfect! Let me summarize what I understand: you're looking for [summary of all context]. I'm ready to find the perfect gifts for you!"
   - SET showSearchButton: true to display the CTA button
   - DO NOT ask for confirmation - the button handles that

5. GENERATING_SEARCH (phase: generating_search)
   - Only reached when user clicks the "Ready to See Gifts" button
   - Immediately generate Enhanced Zinc API search query
   - Navigate to marketplace with context

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
- ONLY show the search button when you have sufficient context for Enhanced Zinc API
- Required context: recipient + occasion + (interests OR brands) + budget
- When ready, set showSearchButton: true and provide clear summary
- The button will handle the actual search generation and navigation

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
- SHOW THE CTA BUTTON when you have sufficient context for Enhanced Zinc API search
- Use specific terms that work well with Enhanced Zinc API
- Focus on conversation flow, trigger CTA button when ready

The Enhanced Zinc API works best with specific brand names, product categories, and descriptive terms.`;

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

    // Determine if we should show the search button based on context completeness
    const hasRequiredContext = Boolean(
      context?.recipient && 
      context?.occasion && 
      (context?.interests?.length > 0 || context?.detectedBrands?.length > 0) &&
      context?.budget
    );

    // Check if AI response indicates readiness for search
    const aiIndicatesReady = 
      aiResponse.toLowerCase().includes('perfect!') ||
      aiResponse.toLowerCase().includes('ready to find') ||
      aiResponse.toLowerCase().includes('let me summarize') ||
      (hasRequiredContext && aiResponse.toLowerCase().includes('understand'));

    const showSearchButton = hasRequiredContext && aiIndicatesReady;

    console.log('CTA Button Logic:', { 
      hasRequiredContext, 
      aiIndicatesReady, 
      showSearchButton,
      context: {
        recipient: context?.recipient,
        occasion: context?.occasion,
        interests: context?.interests,
        brands: context?.detectedBrands,
        budget: context?.budget
      }
    });

    // Update context with Enhanced Zinc API preservation
    const updatedContext = { 
      ...context,
      conversationPhase: showSearchButton ? 'ready_for_search_button' : context?.conversationPhase || 'gathering_info'
    };

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        showSearchButton,
        conversationContinues: !showSearchButton,
        contextualLinks: [],
        contextEnhanced: true,
        ctaButtonSystem: true,
        enhancedZincApiIntegrated: true,
        step: context?.step || 'discovery',
        conversationPhase: updatedContext.conversationPhase,
        userIntent: context?.userIntent || 'none',
        context: updatedContext
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
