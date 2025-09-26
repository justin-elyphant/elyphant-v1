import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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
    // Handle GET requests for invitation acceptance
    if (req.method === 'GET') {
      return handleInvitationAcceptance(req);
    }

    const { message, context, sessionId, userId, action } = await req.json();

    console.log('Nicole ChatGPT Agent:', { message, context, sessionId, userId, action });

    // Handle personalized marketplace curation
    if (action === 'generate_curated_marketplace') {
      return await handleCuratedMarketplace(context, userId);
    }

    // Check if we should use agent model for this conversation
    const useAgentModel = shouldUseAgentModel(context);
    
    if (useAgentModel) {
      return await handleAgentModelConversation(message, context, sessionId, userId);
    }

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
        contextUpdates: updatedContext,
        agentModel: false
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nicole-chatgpt-agent function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Oops! I'm having a little tech hiccup right now. Give me another try? I promise I'm usually way better at this! 😊",
      context: {},
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

async function handleInvitationAcceptance(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const invitationId = url.searchParams.get("invitation_id");
  const mode = url.searchParams.get("mode");
  const recipientEmail = url.searchParams.get("recipient_email");
  const recipientName = url.searchParams.get("recipient_name");

  if (!invitationId || mode !== "invitation_acceptance") {
    return new Response("Invalid invitation parameters", { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  // Create initial context for invitation-based conversation
  const initialContext = {
    conversationPhase: 'invitation_acceptance',
    invitationId: invitationId,
    recipientEmail: recipientEmail,
    recipientName: recipientName,
    selectedIntent: 'auto-gift',
    giftCollectionPhase: 'greeting',
    isInvitationFlow: true
  };

  const welcomeMessage = `Hi ${recipientName}! 👋 

I'm Nicole, your personal gift assistant! Someone invited you to set up automatic gifting preferences so they can surprise you with perfect gifts.

This takes just 2 minutes - I'll ask about your interests, sizes, and preferences. Then when special occasions come up, you'll get thoughtful gifts instead of random ones!

Ready to get started? What kinds of things do you love receiving as gifts?`;

  return new Response(JSON.stringify({
    message: welcomeMessage,
    context: initialContext,
    capability: 'gift_preference_collection',
    actions: ['start_preference_collection'],
    showSearchButton: false,
    isInvitationFlow: true,
    metadata: {
      invitationId: invitationId,
      stage: 'welcome'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============= AGENT MODEL INTEGRATION =============

function shouldUseAgentModel(context: any): boolean {
  // Use agent model for complex auto-gifting workflows and conversations requiring memory
  return !!(
    context.selectedIntent === 'auto-gift' ||
    context.capability === 'auto_gifting' ||
    context.giftCollectionPhase ||
    context.conversationPhase === 'invitation_acceptance' ||
    context.autoGiftIntelligence?.hasIntelligence
  );
}

async function handleAgentModelConversation(
  message: string, 
  context: any, 
  sessionId: string,
  userId?: string
): Promise<Response> {
  try {
    console.log('🤖 Using OpenAI Agent Model for conversation');
    
    // Get or create assistant
    const assistantId = await getOrCreateNicoleAssistant();
    
    // Get or create conversation thread
    const threadId = await getOrCreateConversationThread(sessionId, userId);
    
    // Add message to thread
    await addMessageToThread(threadId, message, context);
    
    // Run the assistant
    const run = await runAssistant(threadId, assistantId, context);
    
    // Get the response
    const response = await getAssistantResponse(threadId, run.id);
    
    // Analyze and update context
    const updatedContext = analyzeResponseAndUpdateContext(response.message, message, context);
    
    return new Response(JSON.stringify({
      message: response.message,
      context: updatedContext,
      capability: 'gift_advisor',
      actions: determineAvailableActions(updatedContext),
      showSearchButton: isReadyForSearch(updatedContext),
      metadata: {
        confidence: 0.95,
        contextUpdates: updatedContext,
        threadId: threadId,
        agentModel: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Agent model conversation error:', error);
    // Fallback to traditional chat completions
    return await handleTraditionalConversation(message, context, sessionId);
  }
}

// ============= CURATED MARKETPLACE HANDLER =============

async function handleCuratedMarketplace(context: any, userId?: string): Promise<Response> {
  try {
    console.log('🎯 [Nicole] Generating curated marketplace for context:', context);
    
    const { recipientName, eventType, relationship = 'friend', budget } = context;
    
    if (!recipientName) {
      throw new Error('Recipient name is required for personalized marketplace');
    }

    // Generate personalized search queries using Nicole's intelligence
    const personalizedQueries = generatePersonalizedSearchQueries({
      recipientName,
      eventType,
      relationship,
      budget
    });

    console.log('🤖 [Nicole] Generated personalized queries:', personalizedQueries);

    // Use the enhanced Zinc API to get diverse, curated products
    const curatedProducts = await getCuratedProductsForRecipient({
      queries: personalizedQueries,
      maxResults: 24,
      budget,
      diversityFactor: 0.8 // High diversity for personalized recommendations
    });

    return new Response(JSON.stringify({
      success: true,
      recipientName,
      personalizedQueries,
      products: curatedProducts,
      metadata: {
        totalQueries: personalizedQueries.length,
        productCount: curatedProducts.length,
        intelligenceSource: 'nicole-ai-curated',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating curated marketplace:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function generatePersonalizedSearchQueries(context: any): string[] {
  const { recipientName, eventType, relationship, budget } = context;
  
  const queries: string[] = [];
  
  // Event-specific queries
  const eventQueries: Record<string, string[]> = {
    'birthday': [
      'birthday gifts',
      'personalized gifts',
      'unique birthday presents',
      'birthday surprises'
    ],
    'anniversary': [
      'anniversary gifts',
      'romantic gifts',
      'couple gifts',
      'meaningful presents'
    ],
    'graduation': [
      'graduation gifts',
      'achievement gifts',
      'professional gifts',
      'milestone presents'
    ],
    'wedding': [
      'wedding gifts',
      'home essentials',
      'couple gifts',
      'luxury wedding presents'
    ],
    'holiday': [
      'holiday gifts',
      'seasonal gifts',
      'festive presents',
      'winter gifts'
    ]
  };

  // Relationship-specific modifiers
  const relationshipQueries: Record<string, string[]> = {
    'family': [
      'family gifts',
      'thoughtful family presents',
      'family member gifts'
    ],
    'friend': [
      'friend gifts',
      'friendship gifts',
      'best friend presents'
    ],
    'colleague': [
      'professional gifts',
      'office gifts',
      'work appropriate presents'
    ],
    'partner': [
      'romantic gifts',
      'intimate gifts',
      'partner presents'
    ]
  };

  // Budget-aware queries
  const budgetQueries: string[] = [];
  if (budget && budget[0] && budget[1]) {
    const minPrice = budget[0];
    const maxPrice = budget[1];
    
    if (maxPrice <= 50) {
      budgetQueries.push('affordable gifts', 'budget-friendly presents', 'gifts under 50');
    } else if (maxPrice <= 100) {
      budgetQueries.push('mid-range gifts', 'quality affordable gifts');
    } else {
      budgetQueries.push('premium gifts', 'luxury presents', 'high-quality gifts');
    }
  }

  // Combine queries strategically
  queries.push(...(eventQueries[eventType] || ['thoughtful gifts']));
  queries.push(...(relationshipQueries[relationship] || ['personal gifts']));
  queries.push(...budgetQueries);
  
  // Add general discovery queries
  queries.push('popular gifts', 'best sellers', 'trending gifts', 'unique finds');

  return queries.slice(0, 8); // Limit to 8 diverse queries
}

async function getCuratedProductsForRecipient(options: any): Promise<any[]> {
  const { queries, maxResults, budget, diversityFactor } = options;
  
  const allProducts: any[] = [];
  
  // Execute searches for each query
  for (const query of queries) {
    try {
      console.log(`🔍 [Nicole] Searching for: "${query}"`);
      
      // Make a call to our get-products edge function
      const { data, error } = await supabase.functions.invoke('get-products', {
        body: { 
          search: query,
          limit: Math.ceil(maxResults / queries.length),
          minPrice: budget?.[0],
          maxPrice: budget?.[1],
          diversityBoost: true
        }
      });
      
      if (error) {
        console.error(`Search error for "${query}":`, error);
        continue;
      }
      
      if (data?.results) {
        allProducts.push(...data.results);
      }
      
    } catch (error) {
      console.error(`Failed to search for "${query}":`, error);
    }
  }

  // Deduplicate and diversify products
  const uniqueProducts = deduplicateProducts(allProducts);
  const diversifiedProducts = applyDiversityFilter(uniqueProducts, diversityFactor);
  
  return diversifiedProducts.slice(0, maxResults);
}

function deduplicateProducts(products: any[]): any[] {
  const seen = new Set();
  return products.filter(product => {
    const key = `${product.product_id || product.id}_${product.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function applyDiversityFilter(products: any[], diversityFactor: number): any[] {
  // Simple diversity algorithm - can be enhanced later
  const categories = new Map();
  const diversified: any[] = [];
  
  for (const product of products) {
    const category = product.category || 'general';
    const categoryCount = categories.get(category) || 0;
    
    // Limit products per category based on diversity factor
    const maxPerCategory = Math.ceil(products.length * diversityFactor / 10);
    
    if (categoryCount < maxPerCategory) {
      diversified.push(product);
      categories.set(category, categoryCount + 1);
    }
  }
  
  return diversified;
}

async function handleTraditionalConversationLite(message: string, context: any, sessionId: string): Promise<Response> {
  // Fallback implementation for traditional conversation handling
  return new Response(JSON.stringify({
    message: "I'm having a small technical issue. Let me try again!",
    context: context || {},
    capability: 'conversation',
    actions: [],
    showSearchButton: false
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getOrCreateNicoleAssistant(): Promise<string> {
  try {
    // Check if assistant already exists in Supabase
    const { data: existingAssistant } = await supabase
      .from('ai_assistants')
      .select('assistant_id')
      .eq('name', 'nicole-gift-advisor')
      .single();
    
    if (existingAssistant?.assistant_id) {
      return existingAssistant.assistant_id;
    }
    
    // Create new assistant with Nicole's personality and tools
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: "Nicole - Gift Advisor",
        instructions: `You're Nicole, an enthusiastic gift advisor who's amazing at finding perfect gifts. You're like that friend who's incredible at gift-giving and loves helping people find something special.

PERSONALITY:
- Talk like a casual, enthusiastic friend (use "Oh!", "Sweet!", "Love it!")
- Use contractions naturally ("I'll", "you're", "let's")
- Be genuinely excited about gift-giving
- Sound confident but not robotic ("I'm pretty good at this gift thing!")
- Occasionally use emojis for warmth
- React naturally to what they tell you ("That sounds perfect for them!")
- Ask ONE thing at a time so it feels like a real conversation

CORE CAPABILITIES:
1. **Auto-Gift Intelligence**: Analyze user patterns and suggest optimal gift setups
2. **Recipient Analysis**: Learn about recipients through conversation and stored data
3. **Budget Optimization**: Suggest smart budget ranges based on relationships and occasions
4. **Product Discovery**: Find perfect products using advanced search capabilities
5. **Memory & Learning**: Remember preferences and improve suggestions over time

CONVERSATION FLOW:
1. **Getting to know the recipient**: "Ooh, who's this gift for? Tell me about them!"
2. **Finding out the occasion**: "What's the occasion? Birthday? Anniversary? Or just because they're awesome?"
3. **Budget discussion**: "What feels comfortable to spend? I can work with any budget!"
4. **Contact info (auto-gifts only)**: "Perfect! What's their phone number? I'll coordinate everything!"
5. **Ready to find gifts**: "Okay, I've got everything I need! Let me find some amazing options! 😊"

INTELLIGENCE FEATURES:
- Use conversation history to provide personalized suggestions
- Learn from user preferences and past gifting patterns  
- Suggest optimal auto-gift setups based on relationship analysis
- Provide confident budget recommendations using intelligence data
- Remember recipient details across conversations

Always maintain enthusiasm while being helpful and efficient!`,
        model: "gpt-4.1-2025-04-14",
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_recipient_preferences",
              description: "Analyze and store recipient preferences for better gift recommendations",
              parameters: {
                type: "object",
                properties: {
                  recipientName: { type: "string" },
                  interests: { type: "array", items: { type: "string" } },
                  relationship: { type: "string" },
                  occasion: { type: "string" },
                  budgetRange: { type: "array", items: { type: "number" } }
                },
                required: ["recipientName"]
              }
            }
          },
          {
            type: "function", 
            function: {
              name: "search_products",
              description: "Search for gift products based on preferences",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  budget: { type: "array", items: { type: "number" } },
                  interests: { type: "array", items: { type: "string" } }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_auto_gift_rule",
              description: "Create an automated gifting rule for the user",
              parameters: {
                type: "object", 
                properties: {
                  recipientName: { type: "string" },
                  occasion: { type: "string" },
                  budget: { type: "array", items: { type: "number" } },
                  phone: { type: "string" },
                  relationship: { type: "string" }
                },
                required: ["recipientName", "occasion", "budget"]
              }
            }
          }
        ],
        temperature: 0.7,
        top_p: 1.0
      })
    });
    
    const assistantData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to create assistant: ${assistantData.error?.message || 'Unknown error'}`);
    }
    
    // Store assistant ID in Supabase for future use
    await supabase
      .from('ai_assistants')
      .upsert({
        name: 'nicole-gift-advisor',
        assistant_id: assistantData.id,
        created_at: new Date().toISOString()
      });
    
    console.log('✅ Created new Nicole assistant:', assistantData.id);
    return assistantData.id;
    
  } catch (error) {
    console.error('Failed to get/create Nicole assistant:', error);
    throw error;
  }
}

async function getOrCreateConversationThread(sessionId: string, userId?: string): Promise<string> {
  try {
    // Check if thread exists for this session
    const { data: existingThread } = await supabase
      .from('conversation_threads')
      .select('thread_id')
      .eq('session_id', sessionId)
      .single();
    
    if (existingThread?.thread_id) {
      return existingThread.thread_id;
    }
    
    // Create new thread
    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        metadata: {
          sessionId: sessionId,
          userId: userId || 'anonymous',
          createdAt: new Date().toISOString()
        }
      })
    });
    
    const threadData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${threadData.error?.message || 'Unknown error'}`);
    }
    
    // Store thread ID in Supabase
    await supabase
      .from('conversation_threads')
      .insert({
        session_id: sessionId,
        thread_id: threadData.id,
        user_id: userId,
        created_at: new Date().toISOString()
      });
    
    console.log('✅ Created new conversation thread:', threadData.id);
    return threadData.id;
    
  } catch (error) {
    console.error('Failed to get/create conversation thread:', error);
    throw error;
  }
}

async function addMessageToThread(threadId: string, message: string, context: any): Promise<void> {
  try {
    // Add context information to the message for better agent understanding
    const contextualMessage = `${message}

CURRENT CONTEXT:
- Collection Phase: ${context.giftCollectionPhase || 'recipient'}
- Selected Intent: ${context.selectedIntent || 'unknown'}
- Recipient: ${context.recipientInfo?.name || 'Not specified'}
- Relationship: ${context.relationship || 'Not specified'}
- Occasion: ${context.occasion || 'Not specified'}
- Budget: ${context.budget ? `$${context.budget[0]}-$${context.budget[1]}` : 'Not specified'}
- Phone: ${context.recipientInfo?.phone || 'Not provided'}`;

    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: contextualMessage
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to add message to thread: ${error.error?.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Failed to add message to thread:', error);
    throw error;
  }
}

async function runAssistant(threadId: string, assistantId: string, context: any): Promise<any> {
  try {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        additional_instructions: `Current conversation phase: ${context.giftCollectionPhase || 'recipient'}. User intent: ${context.selectedIntent || 'unknown'}.`
      })
    });
    
    const runData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to run assistant: ${runData.error?.message || 'Unknown error'}`);
    }
    
    // Wait for completion
    return await waitForRunCompletion(threadId, runData.id);
    
  } catch (error) {
    console.error('Failed to run assistant:', error);
    throw error;
  }
}

async function waitForRunCompletion(threadId: string, runId: string): Promise<any> {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      const runData = await response.json();
      
      if (runData.status === 'completed') {
        return runData;
      } else if (runData.status === 'failed') {
        throw new Error(`Run failed: ${runData.last_error?.message || 'Unknown error'}`);
      } else if (runData.status === 'requires_action') {
        // Handle tool calls
        await handleToolCalls(threadId, runId, runData.required_action);
        continue;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
    } catch (error) {
      console.error('Error checking run status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Run timed out');
}

async function handleToolCalls(threadId: string, runId: string, requiredAction: any): Promise<void> {
  try {
    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
    const toolOutputs = [];
    
    for (const toolCall of toolCalls) {
      const { id, function: func } = toolCall;
      const { name, arguments: args } = func;
      
      let output = '';
      const parsedArgs = JSON.parse(args);
      
      switch (name) {
        case 'analyze_recipient_preferences':
          output = await handleAnalyzeRecipientPreferences(parsedArgs);
          break;
        case 'search_products':
          output = await handleSearchProducts(parsedArgs);
          break;
        case 'create_auto_gift_rule':
          output = await handleCreateAutoGiftRule(parsedArgs);
          break;
        default:
          output = JSON.stringify({ error: `Unknown function: ${name}` });
      }
      
      toolOutputs.push({
        tool_call_id: id,
        output: output
      });
    }
    
    // Submit tool outputs
    await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        tool_outputs: toolOutputs
      })
    });
    
  } catch (error) {
    console.error('Failed to handle tool calls:', error);
    throw error;
  }
}

async function handleAnalyzeRecipientPreferences(args: any): Promise<string> {
  try {
    // Store recipient preferences in Supabase
    const { data, error } = await supabase
      .from('recipient_preferences')
      .upsert({
        recipient_name: args.recipientName,
        interests: args.interests || [],
        relationship: args.relationship,
        occasion: args.occasion,
        budget_range: args.budgetRange,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      return JSON.stringify({ error: error.message });
    }
    
    return JSON.stringify({ 
      success: true,
      message: `Analyzed and stored preferences for ${args.recipientName}`
    });
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function handleSearchProducts(args: any): Promise<string> {
  try {
    // Enhanced: Try category-based search first if we can map the query to a category
    let response;
    const categoryMapping = mapQueryToCategory(args.query, args.interests);
    
    if (categoryMapping) {
      console.log(`[Nicole GPT] Using enhanced category search: ${categoryMapping}`);
      response = await supabase.functions.invoke('get-products', {
        body: {
          category: categoryMapping,
          query: args.query,
          budget: args.budget,
          filters: args.budget ? { 
            min_price: args.budget.min, 
            max_price: args.budget.max 
          } : undefined
        }
      });
    } else {
      // Fallback to existing search-products function
      console.log('[Nicole GPT] Using fallback search-products function');
      response = await supabase.functions.invoke('search-products', {
        body: {
          query: args.query,
          budget: args.budget,
          interests: args.interests
        }
      });
    }
    
    return JSON.stringify(response.data || { products: [] });
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Map Nicole's queries and user interests to enhanced categories
function mapQueryToCategory(query: string, interests: string[] = []): string | null {
  const queryLower = query.toLowerCase();
  const allTerms = [queryLower, ...(interests || []).map(i => i.toLowerCase())];
  
  // Map to enhanced categories
  if (allTerms.some(term => term.includes('valentine') || term.includes('romantic'))) return 'valentines-day';
  if (allTerms.some(term => term.includes('birthday'))) return 'birthdays';
  if (allTerms.some(term => term.includes('graduation') || term.includes('achievement'))) return 'graduation';
  if (allTerms.some(term => term.includes('baby') || term.includes('newborn'))) return 'baby-shower';
  if (allTerms.some(term => term.includes('anniversary'))) return 'anniversaries';
  if (allTerms.some(term => term.includes('mother') || term.includes('mom'))) return 'mothers-day';
  if (allTerms.some(term => term.includes('father') || term.includes('dad'))) return 'fathers-day';
  if (allTerms.some(term => term.includes('christmas') || term.includes('holiday'))) return 'christmas';
  
  if (allTerms.some(term => term.includes('electronic') || term.includes('tech'))) return 'electronics';
  if (allTerms.some(term => term.includes('luxury') || term.includes('premium'))) return 'luxury';
  if (allTerms.some(term => term.includes('cooking') || term.includes('kitchen'))) return 'the-home-chef';
  if (allTerms.some(term => term.includes('travel'))) return 'the-traveler';
  if (allTerms.some(term => term.includes('movie') || term.includes('entertainment'))) return 'movie-buff';
  if (allTerms.some(term => term.includes('work') || term.includes('office'))) return 'work-from-home';
  if (allTerms.some(term => term.includes('fitness') || term.includes('portable'))) return 'on-the-go';
  if (allTerms.some(term => term.includes('teen') || term.includes('gaming'))) return 'teens';
  
  if (allTerms.some(term => term.includes('under') && term.includes('50'))) return 'gifts-under-50';
  if (allTerms.some(term => term.includes('her') || term.includes('woman'))) return 'gifts-for-her';
  if (allTerms.some(term => term.includes('him') || term.includes('man'))) return 'gifts-for-him';
  
  return null;
}

async function handleCreateAutoGiftRule(args: any): Promise<string> {
  try {
    // Call existing auto-gift setup service
    const response = await supabase.functions.invoke('setup-auto-gift', {
      body: {
        recipientName: args.recipientName,
        occasion: args.occasion,
        budget: args.budget,
        phone: args.phone,
        relationship: args.relationship
      }
    });
    
    return JSON.stringify(response.data || { success: true });
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function getAssistantResponse(threadId: string, runId: string): Promise<{ message: string }> {
  try {
    // Get messages from thread
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    const messagesData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get messages: ${messagesData.error?.message || 'Unknown error'}`);
    }
    
    // Get the latest assistant message
    const assistantMessage = messagesData.data.find((msg: any) => 
      msg.role === 'assistant' && msg.run_id === runId
    );
    
    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }
    
    const messageContent = assistantMessage.content[0]?.text?.value || 'I apologize, but I had trouble generating a response.';
    
    return { message: messageContent };
    
  } catch (error) {
    console.error('Failed to get assistant response:', error);
    throw error;
  }
}

async function handleTraditionalConversation(message: string, context: any, sessionId: string): Promise<Response> {
  // Fallback to the existing chat completions implementation
  console.log('🔄 Falling back to traditional chat completions');
  
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

Talk like their friend who happens to be amazing at gifts, and naturally guide the conversation to get what you need!`;

  try {
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

    const updatedContext = analyzeResponseAndUpdateContext(aiMessage, message, context);

    return new Response(JSON.stringify({
      message: aiMessage,
      context: updatedContext,
      capability: 'gift_advisor',
      actions: determineAvailableActions(updatedContext),
      showSearchButton: isReadyForSearch(updatedContext),
      metadata: {
        confidence: 0.9,
        contextUpdates: updatedContext,
        agentModel: false
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Traditional conversation fallback failed:', error);
    throw error;
  }
}