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
    console.log("📨 Nicole chat request received");
    const requestData = await req.json();
    console.log("Enhanced Nicole chat request with CTA button system:", JSON.stringify(requestData, null, 2));

    const { message, context, enhancedFeatures } = requestData;

    if (!message) {
      throw new Error('Message is required');
    }

    // Validate required environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log("Sending Enhanced Zinc API request to OpenAI with CTA button system");

    // Extract conversation history from context
    const conversationHistory = context?.previousMessages || [];
    const isDynamicGreeting = message === '__START_DYNAMIC_CHAT__';
    console.log(`🎯 Dynamic greeting mode: ${isDynamicGreeting}`);
    console.log(`👤 Current user ID: ${context?.currentUserId || 'not provided'}`);

    // Initialize Supabase client for user profile lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user profile for personalization
    let userProfile = null;
    if (context?.currentUserId) {
      try {
        console.log(`🔍 Looking up user profile for ID: ${context.currentUserId}`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, username')
          .eq('id', context.currentUserId)
          .single();
        
        if (profileError) {
          console.error('❌ Error querying user profile:', profileError);
        } else if (profileData) {
          userProfile = profileData;
          console.log('✅ User profile loaded for personalization:', { 
            id: profileData.id, 
            name: profileData.name,
            username: profileData.username
          });
        } else {
          console.log('⚠️ No profile data found for user ID:', context.currentUserId);
        }
      } catch (profileError) {
        console.error('❌ Exception loading user profile:', profileError);
      }
    } else {
      console.log('⚠️ No currentUserId provided in context');
    }

    // Build enriched context with user connections awareness
    let enrichedContext = { ...(context || {}) } as any;
    try {
      if (enrichedContext.currentUserId) {
        const uid = enrichedContext.currentUserId as string;
        console.log(`🔗 Fetching connections for user: ${uid}`);
        const { data: connections, error: connError } = await supabase
          .from('user_connections')
          .select('id, user_id, connected_user_id, status, relationship_type')
          .or(`user_id.eq.${uid},connected_user_id.eq.${uid}`)
          .eq('status', 'accepted');

        if (connError) {
          console.error('❌ Error loading connections:', connError);
        }

        const otherIds = Array.from(new Set((connections || []).map((c: any) => c.user_id === uid ? c.connected_user_id : c.user_id)));

        const profilesMap = new Map<string, any>();
        if (otherIds.length) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, username')
            .in('id', otherIds);
          if (profilesError) {
            console.error('❌ Error loading profiles for connections:', profilesError);
          } else {
            profiles?.forEach((p: any) => profilesMap.set(p.id, p));
          }
        }

        const userConnections = (connections || []).map((c: any) => {
          const otherId = c.user_id === uid ? c.connected_user_id : c.user_id;
          const p = profilesMap.get(otherId);
          return {
            userId: otherId,
            name: p?.name || null,
            username: p?.username || null,
            relationshipType: c.relationship_type,
            status: c.status
          };
        });

        enrichedContext.userConnections = userConnections;
        enrichedContext.hasConnections = userConnections.length > 0;

        // Try to detect if the message mentions one of the connections by name
        const candidates: string[] = [];
        if (typeof enrichedContext.recipient === 'string') candidates.push(enrichedContext.recipient);
        const msgNameMatch = message.match(/friend\s+([A-Za-z][A-Za-z'-]+)/i) || message.match(/\bfor\s+([A-Z][a-zA-Z'-]+)/);
        if (msgNameMatch?.[1]) candidates.push(msgNameMatch[1]);

        const normalize = (s: string) => s.toLowerCase().trim();
        const detectedMatches = userConnections.filter((uc: any) => {
          const full = uc.name || '';
          const first = full.split(' ')[0] || '';
          const uname = uc.username || '';
          return candidates.some(c => {
            const n = normalize(c);
            return (normalize(first) === n) || normalize(full).includes(n) || normalize(uname).includes(n);
          });
        });

        if (detectedMatches.length) {
          enrichedContext.mentionedConnection = detectedMatches[0];
          enrichedContext.detectedConnections = detectedMatches;
          console.log('✅ Detected mentioned connection:', enrichedContext.mentionedConnection);
        } else {
          console.log('ℹ️ No direct connection match detected from message.');
        }
      }
    } catch (e) {
      console.error('❌ Exception while enriching context with connections:', e);
    }

    // Early: handle privacy-aware birthday questions directly (skip OpenAI)
    const lowerMsg = (message || '').toLowerCase();
    const mentionsBirthday = /\bbirthday\b/.test(lowerMsg);

    // Resolve target connection if birthday is asked
    if (mentionsBirthday) {
      console.log('🎯 Special date intent detected: birthday');
      let target = (enrichedContext as any)?.mentionedConnection || (enrichedContext as any)?.detectedConnections?.[0] || null;

      // Fallback: try to parse "<name>'s birthday" or "birthday of <name>"
      if (!target && Array.isArray((enrichedContext as any)?.userConnections)) {
        const possessive = message.match(/([A-Za-z][A-Za-z'-]+)\s*'s\s+birthday/i);
        const ofForm = message.match(/birthday\s+of\s+([A-Za-z][A-Za-z'-]+)/i);
        const rawName = (possessive?.[1] || ofForm?.[1])?.toLowerCase();
        if (rawName) {
          const match = (enrichedContext as any).userConnections.find((uc: any) => {
            const full = (uc.name || '').toLowerCase();
            const first = full.split(' ')[0] || '';
            const uname = (uc.username || '').toLowerCase();
            return first === rawName || full.includes(rawName) || uname === rawName;
          });
          if (match) target = match;
        }
      }

      if (target?.userId && (enrichedContext as any)?.currentUserId) {
        // Fetch target profile
        const { data: targetProfile, error: targetErr } = await supabase
          .from('profiles')
          .select('id, name, dob, data_sharing_settings')
          .eq('id', target.userId)
          .maybeSingle();

        if (targetErr) {
          console.error('❌ Error loading target profile for birthday:', targetErr);
        }

        const viewerId = (enrichedContext as any).currentUserId as string;
        const privacy = (targetProfile as any)?.data_sharing_settings?.dob || 'friends';

        // Privacy check helper
        let allowed = false;
        if (targetProfile?.id === viewerId) {
          allowed = true;
        } else if (privacy === 'public') {
          allowed = true;
        } else if (privacy === 'friends') {
          const { data: connRes, error: connErr } = await supabase
            .rpc('are_users_connected', { user_id_1: viewerId, user_id_2: targetProfile?.id });
          if (connErr) {
            console.error('❌ Error checking connection status:', connErr);
          }
          allowed = Boolean(connRes);
        } else {
          // 'private' or unknown
          allowed = false;
        }

        // Format dob as "Month Day"
        const formatMonthDay = (dob?: string | null) => {
          if (!dob) return null;
          try {
            // Expecting YYYY-MM-DD
            const [y, m, d] = dob.split('-').map((v) => parseInt(v, 10));
            if (!m || !d) return null;
            const date = new Date(y || 2000, (m - 1), d);
            return date.toLocaleString('en-US', { month: 'long', day: 'numeric' });
          } catch (_) {
            return null;
          }
        };

        let reply: string;
        if (allowed && targetProfile?.dob) {
          const pretty = formatMonthDay(targetProfile.dob);
          if (pretty) {
            reply = `${target?.name || 'Your connection'}'s birthday is ${pretty}.`;
            console.log('🎉 Birthday found and shareable:', { targetId: targetProfile.id, pretty });
          } else {
            reply = `I couldn't parse ${target?.name ? target.name + "'s" : 'their'} birthday.`;
            console.log('⚠️ Unable to format DOB string:', targetProfile?.dob);
          }
        } else if (!allowed) {
          reply = "I can’t share that due to privacy settings.";
          console.log('🔒 Privacy check: blocked');
        } else {
          reply = `I don’t have a birthday on file for ${target?.name || 'that person'}.`;
          console.log('ℹ️ No birthday on file');
        }

        const directPayload = {
          message: reply,
          context: { ...(enrichedContext as any) },
          capability: (enrichedContext as any)?.capability || 'conversation',
          actions: ['chat'],
          showSearchButton: false,
          metadata: {
            confidence: 0.95,
            suggestedFollowups: [],
            connectionMatch: target || null
          }
        };

        return new Response(JSON.stringify(directPayload), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Extract user's first name for personalization
    const userFirstName = userProfile?.name?.split(' ')[0] || null;
    console.log(`👋 User first name for greeting: ${userFirstName || 'not found'}`);

    // Enhanced budget parsing function
    const parseBudgetFromMessage = (message: string, currentContext: any) => {
      const budgetPatterns = [
        /\$(\d+(?:,\d+)?)\s*(?:to|[-–])\s*\$(\d+(?:,\d+)?)/i,
        /(\d+(?:,\d+)?)\s*(?:to|[-–])\s*(\d+(?:,\d+)?)\s*(?:dollars?|bucks?|\$)/i,
        /budget.*?\$(\d+(?:,\d+)?)/i,
        /around\s*\$(\d+(?:,\d+)?)/i,
        /under\s*\$(\d+(?:,\d+)?)/i,
        /less\s+than\s*\$(\d+(?:,\d+)?)/i,
        /up\s+to\s*\$(\d+(?:,\d+)?)/i,
        /maximum.*?\$(\d+(?:,\d+)?)/i,
        /max.*?\$(\d+(?:,\d+)?)/i
      ];

      let budget = currentContext?.budget;
      
      for (const pattern of budgetPatterns) {
        const match = message.match(pattern);
        if (match) {
          if (match[2]) {
            const min = parseInt(match[1].replace(',', ''));
            const max = parseInt(match[2].replace(',', ''));
            budget = [min, max];
            console.log(`Budget range detected: $${min}-$${max}`);
            break;
          } else if (match[1]) {
            const amount = parseInt(match[1].replace(',', ''));
            if (message.toLowerCase().includes('under') || message.toLowerCase().includes('less than') || message.toLowerCase().includes('up to') || message.toLowerCase().includes('max')) {
              budget = [0, amount];
              console.log(`Maximum budget detected: up to $${amount}`);
            } else {
              budget = [amount * 0.8, amount * 1.2];
              console.log(`Approximate budget detected: around $${amount}`);
            }
            break;
          }
        }
      }
      
      return budget;
    };

    // Sophisticated system prompt with comprehensive context integration and personalization
    const systemPrompt = `You are Nicole, a warm and intelligent gift advisor. You understand gifting psychology, have access to marketplace data, connection insights, and user preferences.

PERSONALIZATION:
- User's First Name: ${userFirstName ? `"${userFirstName}"` : 'Not available - use casual fallback'}
- CRITICAL: Always use the user's first name "${userFirstName || 'Hey'}" in greetings and throughout conversation
- If no first name available, use casual alternatives like "Hey there!" or "Hi!"
- Make every interaction feel personal and warm, never formal or GPT-ish
- Reference their name naturally in responses

PERSONALITY: Super casual, friendly, enthusiastic about gifts, knowledgeable about trends, conversational but focused. NEVER formal or robotic.

CORE MISSION: Transform gift-giving from stressful to delightful through intelligent recommendations.

ENHANCED CAPABILITIES:
- Connection Integration: Access to user's friends/family for personalized recommendations
- Wishlist Analysis: Deep insights into recipient preferences and interests
- Multi-category Search: Sophisticated product discovery across categories
- Auto-gifting Intelligence: Proactive gift suggestions with timing optimization
- Brand Recognition: Advanced brand preference detection and matching

CONVERSATION INTELLIGENCE:
- Detect auto-gifting intent early in conversation
- Understand relationship contexts and gift appropriateness
- Recognize occasions and timing preferences
- Build comprehensive recipient profiles through conversation

AUTO-GIFT CONVERSATION FLOW (when auto-gifting intent detected):
1. GREETING → assess auto-gifting vs one-time gift intent
2. RECIPIENT_ANALYSIS → who needs auto-gifting setup
3. OCCASION_MAPPING → what events to automate  
4. BUDGET_OPTIMIZATION → intelligent budget recommendations
5. PREFERENCE_CAPTURE → recipient interests and style
6. CONFIRMATION → auto-gift rule summary and activation

Key Auto-Gift Triggers:
- "never want to forget"
- "always remember"  
- "automatically"
- "every year/month"
- "remind me"
- "set up recurring"

Auto-Gift Response Examples:
- "I can set up auto-gifting so you never miss [occasion] for [name]!"
- "Let me help you automate gifts for [name] - what occasions matter most?"
- "Perfect! I've set up auto-gifting for [name]. I'll handle [occasion] gifts within your $[budget] budget using their preferences."
- Provide summary and next steps

REGULAR GIFT ADVISOR FLOW (when NOT auto-gifting):
1. GREETING → gather basic needs
2. RECIPIENT_IDENTIFICATION → determine who the gift is for
3. OCCASION_CONTEXT → understand the celebration or reason
4. RELATIONSHIP_ASSESSMENT → gauge closeness and appropriateness
5. BUDGET_DISCUSSION → establish spending comfort zone
6. INTEREST_DISCOVERY → uncover recipient's preferences, hobbies, style
7. RECOMMENDATION_GENERATION → suggest specific products with reasoning
8. REFINEMENT → adjust based on feedback and preferences

ENHANCED CTA BUTTON SYSTEM:
Show search button when these conditions are met:
1. Has recipient information (specific person or general recipient type)
2. Has occasion OR specific interests/categories identified  
3. Has budget range OR can infer reasonable budget
4. Has gathered enough context for meaningful product search

CTA Logic Examples:
✅ SHOW: "birthday gift for my sister who loves art, $50-100 budget"
✅ SHOW: "housewarming gift for coworker, around $30"  
✅ SHOW: "anniversary gift for wife who likes jewelry and wine"
❌ DON'T SHOW: just "looking for a gift" (too vague)
❌ DON'T SHOW: just "birthday coming up" (no recipient context)

CONVERSATION CONTEXT TRACKING:
- Recipient: person or relationship type
- Occasion: celebration, holiday, milestone, just because
- Budget: range, maximum, or general tier (budget/mid-range/luxury)
- Interests: hobbies, passions, style preferences, brands
- Relationship: closeness level affects appropriateness
- Timeline: urgency affects recommendations

SOPHISTICATED CONTEXT VARIABLES:
    ${enrichedContext ? `
- Current recipient: ${enrichedContext.recipient || 'Not specified'}
- Current occasion: ${enrichedContext.occasion || 'Not specified'}  
- Current interests: ${JSON.stringify(enrichedContext.interests || [])}
- Current brands mentioned: ${JSON.stringify(enrichedContext.detectedBrands || [])}
- Current budget: ${enrichedContext.budget ? `$${enrichedContext.budget[0]}-${enrichedContext.budget[1]}` : 'Not specified'}
- Previous conversation context: ${enrichedContext.previousContext || 'None'}
- User connections available: ${enrichedContext.userConnections?.length || 0}
- User wishlists available: ${enrichedContext.userWishlists?.length || 0}
- Detected connection match: ${enrichedContext.mentionedConnection?.name || 'None'}
    ` : 'No context provided'}

SOPHISTICATED RESPONSE GUIDELINES:
1. Always be warm, helpful, and enthusiastic about gift-giving
2. Ask follow-up questions to gather missing context efficiently  
3. Provide specific, actionable gift suggestions when possible
4. Explain reasoning behind recommendations
5. Offer alternatives and variations
6. Show excitement about helping create meaningful gift experiences
7. Use natural, conversational language that builds rapport
8. Reference the user's name frequently to maintain personal connection

CONTEXT AWARENESS RULES:
- If recipient is specified, focus on their known preferences
- If occasion is mentioned, tailor suggestions appropriately
- If budget is given, respect those constraints strictly
- If relationship type is known, adjust intimacy level of suggestions
- If timeline is mentioned, factor in delivery considerations

CONVERSATION STATE MANAGEMENT:
- Track what information has been gathered vs still needed
- Build upon previous conversation context seamlessly
- Remember user preferences and patterns across the session
- Gradually build more sophisticated recipient profiles

ADVANCED INTELLIGENCE INTEGRATION:
    - Connection data: "${enrichedContext?.userConnections ? `User has ${enrichedContext.userConnections.length} connections` : 'No connection data'}"
    - Wishlist insights: "${enrichedContext?.userWishlists ? `User has ${enrichedContext.userWishlists.length} wishlists` : 'No wishlist data'}"
    - Dynamic greeting mode: ${isDynamicGreeting ? 'YES - This is a greeting response' : 'NO - Regular conversation'}

STRICT RULE: If hasAskedPickQuestion is YES, DO NOT ask about picking gifts yourself vs handling everything. Move to the next phase.
DYNAMIC GREETING RULE: If dynamic greeting mode is YES, start with a casual, friendly greeting using "${userFirstName ? `Hey ${userFirstName}!` : 'Hey there!'}" and naturally transition into conversation. NEVER use formal phrases like "Hello there! I'm so excited..." - always be casual and natural.

CTA CONTEXT AWARENESS: 
- Selected Intent: ${context?.selectedIntent || 'Not specified'}
- Source: ${context?.source || 'Not specified'}
- If selectedIntent is "giftor" and source is "hero_cta", greet with gift-focused message like "Hey ${userFirstName}! I see you want to start gifting! Who are you shopping for today?"
- If selectedIntent is "giftor", tailor conversation toward gift-giving assistance
- Always acknowledge the user's intent when available

CASUAL LANGUAGE RULE: Always use casual, friendly language. Say "Hey!" not "Hello!", "I'm Nicole" not "I'm so excited to help", "What's up?" not "How may I assist you today?". Keep it conversational and natural, never formal or GPT-ish.

PERSONALIZATION RULE: Always use the user's name "${userFirstName || 'there'}" throughout your responses to maintain personal connection.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: isDynamicGreeting ? `Start a casual, friendly greeting conversation. ${userFirstName ? `The user's first name is "${userFirstName}" - greet them with "Hey ${userFirstName}!"` : 'No first name available - use "Hey there!" as greeting'}. ${enrichedContext?.selectedIntent === 'giftor' ? `IMPORTANT: The user clicked "Start Gifting" so acknowledge this with something like "I see you want to start gifting! Who are you shopping for?" after the greeting.` : ''} Be casual and natural, never formal.` : message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from OpenAI');
    }

    console.log("✅ AI Response generated:", aiMessage.substring(0, 100) + "...");

    // Enhanced context parsing with sophisticated intelligence
    const updatedContext = {
      ...enrichedContext,
      currentUserId: enrichedContext?.currentUserId,
      conversationPhase: isDynamicGreeting ? 'greeting_completed' : (enrichedContext?.conversationPhase || 'active'),
      capability: enrichedContext?.capability || 'conversation'
    };

    // Parse and extract context from AI message and user message
    const combinedMessage = `${message} ${aiMessage}`.toLowerCase();
    
    // Enhanced budget parsing
    updatedContext.budget = parseBudgetFromMessage(combinedMessage, enrichedContext);

    // Enhanced recipient parsing
    if (!updatedContext.recipient) {
      const recipientPatterns = [
        /(?:for|gift for) (?:my )?(\w+(?:\s+\w+)?)/i,
        /(?:giving|buying|getting) (?:(?:my|a) )?(\w+) (?:a|an|some)/i,
        /(\w+)'s (?:birthday|anniversary|graduation)/i
      ];
      const stopwords = new Set([
        'gift','present','something','anything',
        'his','her','their','them','him','she','he','someone','anyone',
        'hi','hey'
      ]);
      
      for (const pattern of recipientPatterns) {
        const match = combinedMessage.match(pattern);
        if (match && match[1]) {
          const recipient = match[1].trim();
          const candidate = recipient.toLowerCase();
          if (!stopwords.has(candidate) && candidate.length > 2) {
            updatedContext.recipient = recipient;
            break;
          }
        }
      }
    }

    // Enhanced occasion parsing
    if (!updatedContext.occasion) {
      const occasionPatterns = [
        /\b(birthday|anniversary|graduation|wedding|christmas|valentine|mother's day|father's day|housewarming|baby shower|retirement)\b/i,
        /\b(holiday|celebration|special occasion|milestone)\b/i
      ];
      
      for (const pattern of occasionPatterns) {
        const match = combinedMessage.match(pattern);
        if (match) {
          updatedContext.occasion = match[1];
          break;
        }
      }
    }

    // Enhanced interest parsing
    if (!updatedContext.interests) updatedContext.interests = [];
    const interestPatterns = [
      /(?:loves?|likes?|enjoys?|into|interested in|passionate about) ([^,.!?]+)/gi,
      /(?:hobbies?|interests?) (?:include|are) ([^,.!?]+)/gi,
      /really into ([^,.!?]+)/gi
    ];
    
    for (const pattern of interestPatterns) {
      let match;
      while ((match = pattern.exec(combinedMessage)) !== null) {
        const interests = match[1].split(/\s+and\s+|\s*,\s*/).map(i => i.trim()).filter(i => i.length > 2);
        updatedContext.interests.push(...interests);
      }
    }

    // Remove duplicates from interests
    updatedContext.interests = [...new Set(updatedContext.interests)];

    // Enhanced brand detection
    if (!updatedContext.detectedBrands) updatedContext.detectedBrands = [];
    const brandPatterns = [
      /\b(apple|nike|adidas|gucci|prada|coach|louis vuitton|chanel|tiffany|rolex|omega|sony|samsung|microsoft|amazon|google|tesla|bmw|mercedes|audi|starbucks|disney)\b/gi
    ];
    
    for (const pattern of brandPatterns) {
      let match;
      while ((match = pattern.exec(combinedMessage)) !== null) {
        if (!updatedContext.detectedBrands.includes(match[1].toLowerCase())) {
          updatedContext.detectedBrands.push(match[1].toLowerCase());
        }
      }
    }

    // Enhanced CTA button logic with comprehensive context analysis
    const hasRecipient = Boolean(updatedContext.recipient);
    const hasOccasionOrAge = Boolean(updatedContext.occasion || updatedContext.exactAge);
    const hasInterestsOrBrands = Boolean(
      (updatedContext.interests && updatedContext.interests.length > 0) || 
      (updatedContext.detectedBrands && updatedContext.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(updatedContext.budget);
    
    // More sophisticated context evaluation
    const hasMinimumContext = hasRecipient && (hasOccasionOrAge || hasInterestsOrBrands);
    
    // Check if AI indicates readiness for search
    const aiIndicatesReady = /(?:ready to search|find (?:products|gifts)|search for|look for items|browse (?:products|gifts)|show (?:me )?(?:some )?(?:options|products|gifts))/i.test(aiMessage);
    
    const showSearchButton = hasMinimumContext || (hasBudget && hasInterestsOrBrands) || aiIndicatesReady;

    console.log("CTA Button Logic:", {
      hasRecipient,
      hasOccasionOrAge, 
      hasInterestsOrBrands,
      hasBudget,
      hasMinimumContext,
      aiIndicatesReady,
      showSearchButton,
      context: {
        recipient: updatedContext.recipient,
        occasion: updatedContext.occasion,
        exactAge: updatedContext.exactAge,
        interests: updatedContext.interests,
        brands: updatedContext.detectedBrands,
        budget: updatedContext.budget
      }
    });

    const actions: string[] = ['chat'];
    if (showSearchButton) actions.push('search');
    if (updatedContext?.mentionedConnection) {
      actions.push('find_gifts_for_connection', 'setup_auto_gifting', 'view_wishlist');
    }

    const responsePayload = {
      message: aiMessage,
      context: updatedContext,
      capability: updatedContext.capability,
      actions,
      showSearchButton,
      metadata: {
        confidence: showSearchButton ? 0.8 : 0.4,
        suggestedFollowups: showSearchButton ? 
          [
            `Find gifts for ${updatedContext?.mentionedConnection?.name || 'them'}`,
            'Set up auto-gifting',
            'Show me gift options'
          ] :
          [
            "Tell me more about the recipient",
            "What's the occasion?",
            "What's your budget?"
          ],
        connectionMatch: updatedContext?.mentionedConnection || null
      }
    };

    console.log("Enhanced Zinc API OpenAI response with CTA button system received");

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nicole-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I encountered an error. Please try again!",
      context: {},
      showSearchButton: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
