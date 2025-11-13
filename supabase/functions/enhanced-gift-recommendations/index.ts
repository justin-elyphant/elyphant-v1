import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GiftRecommendationRequest {
  searchContext: {
    recipient?: string;
    relationship?: string;
    occasion?: string;
    budget?: [number, number];
    interests?: string[];
    recipientAge?: number;
    gender?: string;
    lifestyle?: string;
    personalityTraits?: string[];
    conversationHistory?: Array<{ role: string; content: string }>;
    urgency?: 'low' | 'medium' | 'high';
    giftType?: 'surprise' | 'wishlist_based' | 'experience' | 'practical';
  };
  recipientIdentifier?: string; // Email, phone, or name for profile building
  executionId?: string; // Link to automated gift execution
  options?: {
    maxRecommendations?: number;
    includeExplanations?: boolean;
    fallbackToGeneric?: boolean;
    priceRange?: [number, number];
  };
}

interface ProductRecommendation {
  productId: string;
  title: string;
  description: string;
  price: number;
  vendor: string;
  imageUrl?: string;
  category: string;
  matchScore: number;
  matchReasons: string[];
  purchaseUrl?: string;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface GiftRecommendationResponse {
  recommendations: ProductRecommendation[];
  confidence_score: number;
  recommendation_source: string;
  metadata: {
    searchStrategy: string;
    fallbackUsed: boolean;
    recipientProfileCreated: boolean;
    totalProducts: number;
    timeElapsed: number;
  };
  analytics: {
    recommendationId: string;
    contextAnalysis: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const requestData: GiftRecommendationRequest = await req.json();
    const { searchContext, recipientIdentifier, executionId, options = {} } = requestData;

    console.log('🎁 Enhanced Gift Recommendations: Processing request', {
      userId: user.id,
      hasRecipientIdentifier: !!recipientIdentifier,
      hasExecutionId: !!executionId,
      searchContext: searchContext
    });

    // Step 1: Analyze and enhance search context
    const enhancedContext = await enhanceSearchContext(searchContext, user.id, supabaseAdmin);
    
    // Step 2: Generate AI-powered recommendations
    const aiRecommendations = await generateAIRecommendations(enhancedContext, options);
    
    // Step 3: Store recipient profile data if provided
    let recipientProfileCreated = false;
    if (recipientIdentifier && enhancedContext) {
      await storeRecipientIntelligence(user.id, recipientIdentifier, enhancedContext, supabaseAdmin);
      recipientProfileCreated = true;
    }

    // Step 4: Create recommendation record
    const recommendationRecord = await createRecommendationRecord(
      user.id,
      searchContext,
      aiRecommendations,
      executionId,
      supabaseAdmin
    );

    // Step 5: Track analytics
    await trackRecommendationAnalytics(
      recommendationRecord.id,
      user.id,
      'generated',
      { context: enhancedContext, recommendations: aiRecommendations.recommendations },
      supabaseAdmin
    );

    const response: GiftRecommendationResponse = {
      recommendations: aiRecommendations.recommendations,
      confidence_score: aiRecommendations.confidence_score,
      recommendation_source: aiRecommendations.recommendation_source,
      metadata: {
        searchStrategy: aiRecommendations.searchStrategy,
        fallbackUsed: aiRecommendations.fallbackUsed,
        recipientProfileCreated,
        totalProducts: aiRecommendations.recommendations.length,
        timeElapsed: Date.now() - startTime
      },
      analytics: {
        recommendationId: recommendationRecord.id,
        contextAnalysis: enhancedContext
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Enhanced Gift Recommendations Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timeElapsed: Date.now() - startTime 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced context analysis using AI with emergency mode support
async function enhanceSearchContext(context: any, userId: string, supabase: any) {
  console.log('🔍 Enhancing search context with AI analysis');
  
  // Check if this is an emergency/invitation scenario
  const isEmergencyMode = context.urgency === 'high' || (context.recipientIdentifier && !context.recipient);
  
  if (isEmergencyMode) {
    console.log('🆘 Emergency mode detected - using rapid context enhancement');
    return await enhanceEmergencyContext(context, userId, supabase);
  }
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.log('⚠️ OpenAI API key not found, using basic context enhancement');
    return context;
  }

  try {
    const prompt = `Analyze this gift search context and enhance it with additional insights for better product matching:

Context: ${JSON.stringify(context)}

Please provide:
1. Inferred personality traits from the context
2. Lifestyle preferences 
3. Product categories that would be most suitable
4. Price range recommendations
5. Gift timing considerations
6. Any cultural or personal considerations

Return as JSON with enhanced context data.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Nicole, a gift-obsessed friend who loves analyzing what makes people tick to find them the perfect gift. Be casual and insightful.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    const aiData = await response.json();
    const enhancedContext = JSON.parse(aiData.choices[0].message.content);
    
    return { ...context, ...enhancedContext };
    
  } catch (error) {
    console.error('🚨 Context enhancement failed:', error);
    return context;
  }
}

// Core AI recommendation generation
async function generateAIRecommendations(context: any, options: any) {
  console.log('🤖 Generating AI-powered gift recommendations');
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    return generateFallbackRecommendations(context, options);
  }

  try {
    const prompt = `Hey! I need your help finding some amazing gifts for someone special. Here's what I know about them:

Who they are: ${JSON.stringify(context)}
Budget: ${context.budget ? `$${context.budget[0]}-$${context.budget[1]}` : 'Whatever works!'}
Occasion: ${context.occasion || 'Just because they are awesome'}
Relationship: ${context.relationship || 'Someone special'}

Can you suggest 5-8 specific gift products that would make them smile? I need:
1. Realistic product names and descriptions (like what you'd actually find in stores)
2. Prices that fit the budget
3. Where to buy them (Amazon, Target, local shops, etc.)
4. Why each gift is perfect for them specifically
5. What category it falls into
6. Whether it's actually available

Think about what would genuinely make this person happy - practical stuff they'd use, or something that shows you really "get" them. Make it feel personal!

Return as JSON array of products.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Nicole, a friend who\'s obsessed with finding the perfect gifts. Think like someone who knows what makes people happy and suggest gifts like you\'re shopping for a friend.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000
      }),
    });

    const aiData = await response.json();
    const recommendations = JSON.parse(aiData.choices[0].message.content);
    
    // Process and standardize recommendations
    const processedRecommendations: ProductRecommendation[] = recommendations.map((rec: any, index: number) => ({
      productId: `ai-rec-${Date.now()}-${index}`,
      title: rec.title || 'AI Recommended Gift',
      description: rec.description || 'Personalized recommendation based on recipient profile',
      price: rec.price || (context.budget ? context.budget[0] : 50),
      vendor: rec.vendor || 'Multiple Vendors',
      imageUrl: rec.imageUrl || null,
      category: rec.category || 'General',
      matchScore: Math.min(0.95, 0.7 + (Math.random() * 0.25)), // High confidence for AI recs
      matchReasons: rec.matchReasons || ['AI-generated personalized recommendation'],
      purchaseUrl: rec.purchaseUrl || null,
      availability: rec.availability || 'in_stock'
    }));

    return {
      recommendations: processedRecommendations,
      confidence_score: 0.85,
      recommendation_source: 'ai_analysis',
      searchStrategy: 'openai_personalized',
      fallbackUsed: false
    };

  } catch (error) {
    console.error('🚨 AI recommendation generation failed:', error);
    return generateFallbackRecommendations(context, options);
  }
}

// Fallback recommendations when AI is unavailable
function generateFallbackRecommendations(context: any, options: any) {
  console.log('🔄 Generating fallback recommendations');
  
  const fallbackProducts: ProductRecommendation[] = [
    {
      productId: 'fallback-001',
      title: 'Premium Gift Card',
      description: 'Versatile gift card allowing recipient to choose their preferred gift',
      price: context.budget ? Math.min(context.budget[1], 100) : 50,
      vendor: 'Multiple Retailers',
      category: 'Gift Cards',
      matchScore: 0.6,
      matchReasons: ['Universal appeal', 'Recipient choice flexibility'],
      availability: 'in_stock'
    },
    {
      productId: 'fallback-002',
      title: 'Artisan Chocolate Box',
      description: 'Premium selection of handcrafted chocolates',
      price: context.budget ? Math.min(context.budget[1], 35) : 25,
      vendor: 'Local Chocolatier',
      category: 'Food & Treats',
      matchScore: 0.7,
      matchReasons: ['Universal appreciation', 'Thoughtful presentation'],
      availability: 'in_stock'
    },
    {
      productId: 'fallback-003',
      title: 'Wellness Care Package',
      description: 'Curated collection of self-care and wellness items',
      price: context.budget ? Math.min(context.budget[1], 75) : 45,
      vendor: 'Various Brands',
      category: 'Health & Wellness',
      matchScore: 0.65,
      matchReasons: ['Promotes well-being', 'Thoughtful gesture'],
      availability: 'in_stock'
    }
  ];

  return {
    recommendations: fallbackProducts,
    confidence_score: 0.6,
    recommendation_source: 'fallback_catalog',
    searchStrategy: 'generic_fallback',
    fallbackUsed: true
  };
}

// Store recipient intelligence for future improvements
async function storeRecipientIntelligence(userId: string, recipientIdentifier: string, context: any, supabase: any) {
  try {
    const profileData = {
      interests: context.interests || [],
      preferences: {
        budget_range: context.budget,
        preferred_categories: context.preferredCategories || [],
        occasions: context.occasion ? [context.occasion] : [],
        personality_traits: context.personalityTraits || [],
        lifestyle: context.lifestyle
      },
      demographics: {
        age_range: context.recipientAge,
        gender: context.gender,
        relationship: context.relationship
      },
      conversation_insights: {
        last_context: context,
        updated_at: new Date().toISOString()
      }
    };

    await supabase
      .from('recipient_intelligence_profiles')
      .upsert({
        user_id: userId,
        recipient_identifier: recipientIdentifier,
        profile_data: profileData,
        data_sources: {
          sources: ['nicole_conversation', 'ai_analysis'],
          collection_methods: ['enhanced_conversation_analysis']
        },
        confidence_level: 0.75,
        last_updated: new Date().toISOString()
      });

    console.log('✅ Recipient intelligence profile updated');
  } catch (error) {
    console.error('🚨 Failed to store recipient intelligence:', error);
  }
}

// Create recommendation record for tracking
async function createRecommendationRecord(userId: string, searchContext: any, aiRecommendations: any, executionId: string | undefined, supabase: any) {
  const { data, error } = await supabase
    .from('gift_recommendations')
    .insert({
      user_id: userId,
      search_context: searchContext,
      recommendation_data: {
        recommendations: aiRecommendations.recommendations,
        metadata: {
          search_strategy: aiRecommendations.searchStrategy,
          fallback_used: aiRecommendations.fallbackUsed,
          generated_at: new Date().toISOString()
        }
      },
      confidence_score: aiRecommendations.confidence_score,
      recommendation_source: aiRecommendations.recommendation_source,
      execution_id: executionId || null,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Track analytics for recommendation improvement
async function trackRecommendationAnalytics(recommendationId: string, userId: string, eventType: string, eventData: any, supabase: any) {
  try {
    await supabase
      .from('gift_recommendation_analytics')
      .insert({
        recommendation_id: recommendationId,
        user_id: userId,
        event_type: eventType,
        event_data: eventData
      });
  } catch (error) {
    console.error('🚨 Analytics tracking failed:', error);
  }
}

// Emergency context enhancement for new/invited users
async function enhanceEmergencyContext(context: any, userId: string, supabase: any) {
  console.log('🆘 Enhancing context for emergency/invitation scenario');
  
  try {
    // Try to gather rapid intelligence about the recipient
    const recipientData = await gatherRapidRecipientIntelligence(
      context.recipientIdentifier,
      userId,
      supabase
    );
    
    // Get inviter's profile as proxy intelligence
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, enhanced_gifting_history, dob')
      .eq('id', userId)
      .single();
    
    // Infer context from available data
    const enhancedContext = {
      ...context,
      
      // Emergency-specific enhancements
      emergency_mode: true,
      data_sources: ['invitation_context', 'inviter_proxy', 'demographic_inference'],
      
      // Rapid recipient profiling
      recipient_intelligence: recipientData,
      
      // Use inviter's preferences as proxy
      inviter_proxy_data: {
        gift_style: inviterProfile?.enhanced_gift_preferences?.preferred_gift_styles?.[0] || 'thoughtful',
        typical_budget_range: inviterProfile?.enhanced_gift_preferences?.preferred_price_ranges?.general || [25, 100],
        successful_categories: Object.keys(inviterProfile?.enhanced_gifting_history?.category_success_rates || {}),
      },
      
      // Enhanced urgency handling
      urgency_factors: {
        delivery_constraint: context.urgency === 'high',
        profile_completion_time: 'limited',
        decision_confidence: 'medium_due_to_limited_data',
      },
      
      // Smart defaults based on common patterns
      inferred_preferences: {
        safe_categories: ['gift_cards', 'flowers', 'gourmet_food', 'books', 'wellness'],
        avoid_categories: ['intimate_apparel', 'highly_personal_items', 'niche_hobbies'],
        universal_appeal_items: true,
      }
    };
    
    console.log('✅ Emergency context enhancement complete');
    return enhancedContext;
    
  } catch (error) {
    console.error('🚨 Emergency context enhancement failed:', error);
    return {
      ...context,
      emergency_mode: true,
      enhancement_failed: true,
      safe_mode: true
    };
  }
}

// Rapid recipient intelligence gathering for emergency scenarios
async function gatherRapidRecipientIntelligence(recipientIdentifier: string, userId: string, supabase: any) {
  console.log('🔍 Gathering rapid recipient intelligence');
  
  try {
    // Check if we have any existing data about this recipient
    const { data: existingProfiles } = await supabase
      .from('recipient_intelligence_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('recipient_identifier', recipientIdentifier)
      .order('last_updated', { ascending: false })
      .limit(1);
    
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('📋 Found existing recipient intelligence');
      return existingProfiles[0].profile_data;
    }
    
    // Check invitation analytics for any context
    const { data: invitationData } = await supabase
      .from('gift_invitation_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('recipient_email', recipientIdentifier)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Try to find the recipient's profile if they've joined
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('dob, enhanced_gift_preferences, data_sharing_settings')
      .eq('email', recipientIdentifier)
      .single();
    
    // Compile available intelligence
    const intelligence = {
      data_sources: [] as string[],
      confidence_level: 'low' as 'low' | 'medium' | 'high',
      
      // From invitation context
      relationship_context: invitationData ? {
        relationship_type: invitationData.relationship_type,
        invitation_occasion: invitationData.occasion,
        invitation_date: invitationData.created_at,
      } : null,
      
      // From recipient profile (if available)
      recipient_data: recipientProfile ? {
        age: recipientProfile.dob ? calculateAge(recipientProfile.dob) : null,
        has_preferences: !!recipientProfile.enhanced_gift_preferences,
        data_sharing_level: recipientProfile.data_sharing_settings?.general || 'limited',
      } : null,
      
      // Emergency defaults
      emergency_assumptions: {
        prefers_safe_choices: true,
        appreciates_thoughtful_gestures: true,
        values_presentation: true,
        delivery_preference: 'standard_plus_thoughtful_note',
      }
    };
    
    // Add data sources
    if (invitationData) intelligence.data_sources.push('invitation_analytics');
    if (recipientProfile) intelligence.data_sources.push('recipient_profile');
    intelligence.data_sources.push('emergency_defaults');
    
    // Calculate confidence level
    intelligence.confidence_level = intelligence.data_sources.length > 1 ? 'medium' : 'low';
    
    console.log(`📊 Gathered rapid intelligence with ${intelligence.data_sources.length} sources`);
    return intelligence;
    
  } catch (error) {
    console.error('🚨 Rapid intelligence gathering failed:', error);
    return {
      data_sources: ['emergency_defaults'],
      confidence_level: 'very_low',
      emergency_assumptions: {
        prefers_safe_choices: true,
        appreciates_thoughtful_gestures: true,
        values_presentation: true,
      }
    };
  }
}

// Helper function to calculate age (duplicate but needed here)
function calculateAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}