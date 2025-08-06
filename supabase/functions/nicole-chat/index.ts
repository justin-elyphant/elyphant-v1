
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

    // Enhanced system prompt with sophisticated auto-gift conversation flow integration
    let systemPrompt = `You are Nicole, an expert AI gift advisor with Enhanced Zinc API System integration and sophisticated auto-gifting conversation capabilities. Your mission is to help users find perfect gifts through intelligent conversation flow with the existing sophisticated auto-gifting system.

ENHANCED CAPABILITIES:
- Connection Integration: Access to user's friends/family for personalized recommendations
- Wishlist Integration: Reference user's saved items and preferences
- Real-time Data: Current user connections and wishlist insights
- Marketplace Integration: Direct connection to Enhanced Zinc API System
- SOPHISTICATED AUTO-GIFT FLOW: Integrated with existing 18+ step conversation system

CURRENT USER DATA:
${context?.userConnections ? `- Connections: ${context.userConnections.length} friends/family members (${context.userConnections.map(c => c.name).join(', ')})` : '- No connection data available - user has no connected friends/family in the system'}
${context?.userWishlists ? `- Wishlists: ${context.userWishlists.length} saved lists with items` : '- No wishlist data available'}

CRITICAL CONNECTION ACCURACY:
- ONLY claim connections exist if context.userConnections array has actual data
- If no connections exist, acknowledge this truthfully: "I don't see [name] in your connections yet"
- NEVER make up or assume connections that don't exist in the data
- Be honest about what data is available vs not available

SOPHISTICATED AUTO-GIFT CONVERSATION FLOW:
When user mentions auto-gifting intent OR when context.selectedIntent === 'auto-gift' OR context.capability === 'auto_gifting':

DUPLICATE QUESTION PREVENTION:
- Track all questions asked in conversation history
- NEVER ask the same question twice in a single conversation
- Check conversation history before asking key questions like "Do you want to pick the gift yourself..."

PHASE 1: AUTO_GIFT_CHOICE (conversationPhase: auto_gift_choice)
- ONLY ask if NOT already asked: "Do you want to pick the gift yourself or have me handle everything for you?"
- Present the two distinct paths clearly
- Wait for user's choice before proceeding

PHASE 2A: ELYPHANT_HANDLES_EVERYTHING (user chooses AI handling)
- Ask: "Perfect! Who is this gift for? Please provide their name."
- Collect recipient name for connection analysis
- Move to CONNECTION_ANALYSIS phase

PHASE 2B: USER_PICKS_THEMSELVES (user chooses manual selection)
- Provide marketplace link and guidance
- End auto-gift flow, transition to marketplace

PHASE 3: CONNECTION_ANALYSIS (after receiving recipient name)
- Search user's connections for the recipient by comparing names
- CONNECTION VERIFICATION REQUIRED:
  * Check if userConnections array contains the recipient
  * Look for exact or partial name matches in the connections data
  * ONLY claim connection exists if found in actual data
- If connection found in userConnections:
  * Use actual connection data (interests, preferences, relationship_type)
  * "I found [name] in your connections! I see they like [actual interests from connection]. What's your budget for this gift?"
- If no connection found in userConnections array:
  * SMART SEARCH: Check if they exist on the platform but aren't connected yet
  * Search context.searchResults for matching names if available
  * If found on platform: "I found [name] on Elyphant! Should I send them a connection request so we can set up auto-gifting?"
  * If not found: "I don't see [name] yet. I can invite them to join so you can set up auto-gifting!"
  * Provide appropriate buttons: "Connect & Setup" or "Invite to Elyphant"
- Move to BUDGET_CONFIRMATION or CONNECTION_REQUEST or INVITATION_FLOW

PHASE 4: BUDGET_CONFIRMATION (when connection exists)
- Use relationship intelligence for budget suggestions
- "Based on your relationship as [relationship_type], I suggest $[min]-[max]. Does this work for you?"
- Adjust based on user feedback
- Move to AUTO_GIFT_SETUP_COMPLETE

PHASE 5: INVITATION_FLOW (when no connection exists)
- Collect phone number if not provided
- "I'll send [name] a friendly text to learn about their preferences"
- Explain the process: SMS → preferences collection → curated recommendations → email approval
- Move to INVITATION_SENT

PHASE 6: AUTO_GIFT_SETUP_COMPLETE
- Confirm all settings
- "Perfect! I've set up auto-gifting for [name]. I'll handle [occasion] gifts within your $[budget] budget using their preferences."
- Provide summary and next steps

SOPHISTICATED CONVERSATION CONTEXT MANAGEMENT:
- Track conversation phase precisely
- Use actual connection data when available
- Leverage relationship intelligence for personalized suggestions
- Maintain conversation continuity across interactions
- Handle context updates seamlessly

INTEGRATION WITH EXISTING SYSTEM:
- When auto-gift intent detected, activate sophisticated conversation flow
- Use existing connection analysis and recipient detection logic
- Leverage existing invitation and SMS engagement system
- Connect to existing auto-gifting rule creation and management
- Maintain compatibility with existing dashboard and approval systems

REGULAR GIFT ADVISOR FLOW (when NOT auto-gifting):
1. GREETING → gather basic needs
2. RECIPIENT_IDENTIFICATION → determine who the gift is for
3. OCCASION_CONTEXT → understand the occasion/event
4. INTEREST_GATHERING → collect recipient interests and preferences
5. BUDGET_SETTING → establish spending parameters
6. READY_FOR_SEARCH → trigger marketplace search with CTA button

CONTEXT TRACKING:
Current context: ${JSON.stringify(context || {})}
- Capability: ${context?.capability || 'unknown'}
- Selected Intent: ${context?.selectedIntent || 'unknown'}
- Conversation Phase: ${context?.conversationPhase || 'greeting'}
- Recipient: ${context?.recipient || 'Unknown'}
- Relationship: ${context?.relationship || 'Unknown'}
- Auto-Gift Flow Active: ${context?.isAutoGiftFlow || context?.selectedIntent === 'auto-gift' ? 'YES' : 'NO'}

CONNECTION DATA AVAILABLE:
${context?.userConnections ? context.userConnections.map((conn: any, i: number) => 
  `${i + 1}. ${conn.name || 'Unknown'} (${conn.relationship || 'Unknown'}) - Interests: ${conn.interests?.join(', ') || 'None'}`
).join('\n') : 'No connections available'}

SOPHISTICATED AUTO-GIFT RESPONSE RULES:
- When auto-gift context is detected, immediately engage sophisticated conversation flow
- Use actual connection data and relationship intelligence
- Follow the precise conversation phases for consistency
- Handle both connection-exists and invitation-needed scenarios
- Provide clear, actionable next steps at each phase
- Maintain warm, conversational tone while being systematically thorough

BUDGET INTELLIGENCE:
- Use relationship context for smart budget suggestions
- Close friends/family: $50-100 range
- Casual friends/colleagues: $25-50 range
- Special occasions: 20% higher suggestions
- Parse user budget preferences accurately

The system should feel like a natural conversation that leverages all the sophisticated backend logic while maintaining the warm, helpful Nicole personality.`;

    if (context?.userWishlists && context.userWishlists.length > 0) {
      systemPrompt += `\n\nUSER'S WISHLIST INSIGHTS:
${context.userWishlists.map((list: any, i: number) => 
  `${i + 1}. "${list.title}" (${list.category || 'General'}) - ${list.wishlist_items?.length || 0} items`
).join('\n')}

You can reference their taste preferences based on their saved items when making recommendations.`;
    }

    // Check for dynamic greeting trigger
    const isDynamicGreeting = message === "__START_DYNAMIC_CHAT__" || message === "__START_AUTO_GIFT__" || (context.greetingContext && (!conversationHistory || conversationHistory.length === 0));
    
    // Check if key auto-gift question has already been asked
    const hasAskedPickQuestion = conversationHistory?.some(msg => 
      msg.content?.toLowerCase().includes('pick the gift yourself') ||
      msg.content?.toLowerCase().includes('handle everything for you')
    ) || false;

    // Construct the user message with context - handle dynamic greeting
    let userMessage;
    if (isDynamicGreeting) {
      if (message === "__START_AUTO_GIFT__") {
        userMessage = `Generate a dynamic greeting to start an auto-gifting conversation. Use the greeting context to personalize the message and immediately begin helping with auto-gift setup.

GREETING CONTEXT: ${JSON.stringify(context.greetingContext || {}, null, 2)}

Start the conversation naturally as if responding to the user clicking "Start Auto-Gifting" button.`;
      } else if (message === "__START_DYNAMIC_CHAT__") {
        userMessage = `Generate a dynamic greeting to start a conversation. Use the greeting context to personalize the message based on the user's intent and how they arrived here.

GREETING CONTEXT: ${JSON.stringify(context.greetingContext || {}, null, 2)}

Start the conversation naturally as if responding to the user's action (button click, CTA interaction, etc).`;
      } else {
        userMessage = `This is the first message in our conversation. Generate a contextual greeting based on the user's intent and the greeting context provided, then respond to their message.

GREETING CONTEXT: ${JSON.stringify(context.greetingContext || {}, null, 2)}
USER MESSAGE: ${message}

Respond as Nicole with a natural greeting that leads into helping with their request.`;
      }
    } else {
      userMessage = message;
    }

    const messages = [
      { role: 'system', content: systemPrompt + `\n\nCONVERSATION HISTORY CONTEXT:
- Has asked "pick yourself vs handle everything" question: ${hasAskedPickQuestion ? 'YES - DO NOT ASK AGAIN' : 'NO - can ask if appropriate'}
- Total conversation messages: ${conversationHistory?.length || 0}
- Last user message: ${conversationHistory?.filter(msg => msg.role === 'user').slice(-1)?.[0]?.content || 'None'}
- Dynamic greeting mode: ${isDynamicGreeting ? 'YES - This is a greeting response' : 'NO - Regular conversation'}

STRICT RULE: If hasAskedPickQuestion is YES, DO NOT ask about picking gifts yourself vs handling everything. Move to the next phase.
DYNAMIC GREETING RULE: If dynamic greeting mode is YES, start with a warm, personalized greeting that references the greeting context and then naturally transition into the conversation.` },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
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

    // Detect auto-gift intent and enforce strict flow
    const messageLower = message.toLowerCase();
    const isAutoGiftIntent = messageLower.includes('auto gift') || 
                           messageLower.includes('auto-gift') || 
                           messageLower.includes('set up auto') || 
                           messageLower.includes('automated gift') || 
                           messageLower.includes('automatic gift') ||
                           messageLower.includes('auto gifting');

    // Enhanced recipient name and phone parsing for sophisticated auto-gift flow
    let recipientName = context?.recipientName || null;
    let recipientPhone = context?.recipientPhone || null;
    
    // Parse recipient name from various conversation contexts
    if (isAutoGiftIntent || context?.selectedIntent === 'auto-gift' || context?.capability === 'auto_gifting') {
      // Enhanced name extraction patterns
      const namePatterns = [
        // Direct name responses: "Dua", "Sarah", "John Smith"
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/,
        // "for Dua", "gift for Sarah"
        /(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        // "my friend Dua", "my sister Sarah"
        /my\s+(?:friend|sister|brother|mom|dad|wife|husband|colleague|coworker)\s+([A-Z][a-z]+)/i,
        // "It's for Dua", "This is for Sarah"  
        /(?:it'?s|this\s+is)\s+for\s+([A-Z][a-z]+)/i,
        // "Dua Lipa", "John Doe" (full names)
        /([A-Z][a-z]+\s+[A-Z][a-z]+)/,
        // Name at start of message
        /^([A-Z][a-z]+)/
      ];

      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          recipientName = match[1].trim();
          console.log(`Recipient name detected: ${recipientName}`);
          break;
        }
      }

      // Phone number extraction
      const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,})/;
      const phoneMatch = message.match(phonePattern);
      if (phoneMatch) {
        recipientPhone = phoneMatch[0];
        console.log(`Phone number detected: ${recipientPhone}`);
      }
    }

    // Check connections for the recipient first
    let connectionFound = false;
    let connectionPreferences = null;
    let platformUserFound = false;
    let platformUserData = null;
    
    if (recipientName && context?.userConnections) {
      const connection = context.userConnections.find((conn: any) => 
        conn.profiles?.name?.toLowerCase().includes(recipientName.toLowerCase()) ||
        conn.profiles?.first_name?.toLowerCase() === recipientName.toLowerCase()
      );
      
      if (connection) {
        connectionFound = true;
        connectionPreferences = {
          name: connection.profiles?.name || recipientName,
          interests: connection.profiles?.interests || [],
          preferences: connection.profiles?.gift_preferences || [],
          brands: connection.profiles?.favorite_brands || []
        };
      }
    }
    
    // If no connection found, search for the user on the platform
    if (!connectionFound && recipientName) {
      try {
        const { data: searchResults } = await supabase
          .from('profiles')
          .select('id, name, username, email')
          .or(`name.ilike.%${recipientName}%,username.ilike.%${recipientName}%`)
          .limit(3);
        
        if (searchResults && searchResults.length > 0) {
          platformUserFound = true;
          platformUserData = searchResults[0]; // Take the first match
          console.log(`✅ Found platform user: ${recipientName}`, platformUserData);
        } else {
          console.log(`❌ No platform user found for: ${recipientName}`);
        }
      } catch (searchError) {
        console.error('Error searching for platform users:', searchError);
      }
    }

    // Sophisticated conversation phase management for auto-gifting flow
    let newConversationPhase = context?.conversationPhase || 'greeting';
    
    // Auto-gift intent detection and phase transitions
    if (isAutoGiftIntent || context?.selectedIntent === 'auto-gift' || context?.capability === 'auto_gifting') {
      if (!context?.conversationPhase || context?.conversationPhase === 'greeting') {
        newConversationPhase = 'auto_gift_choice';
      } else if (context?.conversationPhase === 'auto_gift_choice') {
        // Check user response to determine next phase
        if (messageLower.includes('pick') && (messageLower.includes('myself') || messageLower.includes('i want to pick') || messageLower.includes('i\'ll pick'))) {
          newConversationPhase = 'auto_gift_user_pick';
        } else if (messageLower.includes('handle') || messageLower.includes('you pick') || messageLower.includes('elyphant') || messageLower.includes('auto')) {
          newConversationPhase = 'auto_gift_elyphant_pick';
        }
      } else if (context?.conversationPhase === 'auto_gift_elyphant_pick' && recipientName) {
        newConversationPhase = 'auto_gift_connection_check';
      } else if (context?.conversationPhase === 'auto_gift_connection_check') {
        if (connectionFound) {
          newConversationPhase = 'auto_gift_budget_confirmation';
        } else {
          newConversationPhase = 'auto_gift_invitation_flow';
        }
      } else if (context?.conversationPhase === 'auto_gift_budget_confirmation' && updatedBudget) {
        newConversationPhase = 'auto_gift_setup_complete';
      } else if (context?.conversationPhase === 'auto_gift_invitation_flow' && recipientPhone) {
        newConversationPhase = 'auto_gift_invitation_sent';
      }
    }

    // Enhanced context parsing with sophisticated auto-gift flow and connection data
    const enhancedContext = {
      ...context,
      budget: updatedBudget || context?.budget,
      isAutoGiftFlow: isAutoGiftIntent || context?.isAutoGiftFlow || context?.selectedIntent === 'auto-gift',
      recipientName,
      recipientPhone,
      connectionFound,
      connectionPreferences,
      platformUserFound,
      platformUserData,
      conversationPhase: newConversationPhase
    };

    // Auto-gift flow takes priority over regular search flow
    let showSearchButton = false;
    let showMarketplaceLink = false;
    
    if (enhancedContext?.isAutoGiftFlow) {
      // Don't show search button for auto-gift flow
      showSearchButton = false;
      
      // Check if user chose to pick the gift themselves
      if (messageLower.includes('pick') && messageLower.includes('myself') || 
          messageLower.includes('i want to pick') || 
          messageLower.includes('i\'ll pick')) {
        showMarketplaceLink = true;
      }
    }
    
    // Regular gift advisor flow check (outside of auto-gift logic)
    const hasRecipient = Boolean(enhancedContext?.recipient);
    const hasOccasionOrAge = Boolean(enhancedContext?.occasion || enhancedContext?.exactAge);
    const hasInterestsOrBrands = Boolean(
      (enhancedContext?.interests && enhancedContext.interests.length > 0) || 
      (enhancedContext?.detectedBrands && enhancedContext.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(enhancedContext?.budget && Array.isArray(enhancedContext.budget) && enhancedContext.budget.length === 2);
    
    // Define variables outside the if block so they're available for logging
    const hasMinimumContext = hasRecipient && hasOccasionOrAge && hasInterestsOrBrands && hasBudget;
    let aiIndicatesReady = false;
    
    if (!enhancedContext?.isAutoGiftFlow) {
      // Regular gift advisor flow

      // Check if AI response indicates readiness for search
      aiIndicatesReady = 
        aiResponse.toLowerCase().includes('perfect!') ||
        aiResponse.toLowerCase().includes('ready to find') ||
        aiResponse.toLowerCase().includes('let me summarize') ||
        (hasMinimumContext && aiResponse.toLowerCase().includes('understand'));

      showSearchButton = hasMinimumContext && aiIndicatesReady;
    }

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

    // Check if auto-gift setup should be triggered
    let actions = [];
    let ctaButtons = [];
    
    if (enhancedContext?.isAutoGiftFlow && 
        (newConversationPhase === 'auto_gift_setup_complete' || 
         aiResponse.toLowerCase().includes("i've set up auto-gifting") ||
         aiResponse.toLowerCase().includes("auto-gifting is now set up"))) {
      actions.push('setup_auto_gifting');
    }
    
    // Add CTA buttons for connection/invitation scenarios
    if (enhancedContext?.platformUserFound && !enhancedContext?.connectionFound) {
      ctaButtons.push({
        text: "Connect & Setup Auto-Gifting",
        action: "connect_and_setup",
        variant: "default"
      });
    } else if (!enhancedContext?.connectionFound && !enhancedContext?.platformUserFound && enhancedContext?.recipientName) {
      ctaButtons.push({
        text: "Invite to Elyphant",
        action: "invite_to_elyphant",
        variant: "default"
      });
    }

    // Update context with Enhanced Zinc API preservation and auto-gift flow
    const updatedContext = { 
      ...enhancedContext,
      conversationPhase: showSearchButton ? 'ready_for_search_button' : enhancedContext?.conversationPhase || 'gathering_info'
    };

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        message: aiResponse,
        actions: actions,
        ctaButtons: ctaButtons,
        showSearchButton,
        showMarketplaceLink,
        conversationContinues: !showSearchButton && !showMarketplaceLink,
        contextualLinks: showMarketplaceLink ? [{ text: 'Browse Marketplace', url: '/marketplace' }] : [],
        contextEnhanced: true,
        ctaButtonSystem: true,
        enhancedZincApiIntegrated: true,
        autoGiftFlow: enhancedContext?.isAutoGiftFlow || false,
        step: enhancedContext?.step || 'discovery',
        conversationPhase: updatedContext.conversationPhase,
        userIntent: enhancedContext?.userIntent || 'none',
        context: updatedContext,
        // Enhanced Week 2 features
        enhancedFeatures: {
          connectionIntegration: Boolean(context?.userConnections),
          wishlistIntegration: Boolean(context?.userWishlists),
          realTimeData: true,
          marketplaceIntegration: true,
          autoGiftSimplification: true
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
