import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Processing pending auto-gift executions for user ${userId}`);
    
    // First check for stuck executions for this user (reset processing to pending)
    console.log('🔄 Resetting stuck processing executions...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { error: resetError } = await supabase
      .from('automated_gift_executions')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinutesAgo);

    if (resetError) {
      console.error('❌ Error resetting stuck executions:', resetError);
    }

    // Check for existing executions to prevent duplicates
    console.log('🔍 Checking for existing executions to prevent duplicates...');
    const { data: existingExecutions, error: existingError } = await supabase
      .from('automated_gift_executions')
      .select('id, rule_id, event_id, execution_date, status')
      .eq('user_id', userId)
      .gte('execution_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 24 hours

    if (existingError) {
      console.error('❌ Error checking existing executions:', existingError);
    } else {
      console.log(`📊 Found ${existingExecutions?.length || 0} existing executions in last 24 hours`);
    }

    // Get all pending executions for this user
    const { data: executions, error } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*),
        user_special_dates (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error fetching pending executions:', error);
      throw error;
    }

    console.log(`📊 Found ${executions?.length || 0} pending executions to process`);

    // Process each execution using the existing UnifiedGiftAutomationService logic
    for (const execution of executions || []) {
      try {
        console.log(`📦 Processing execution ${execution.id}`);
        
        // Check for duplicate execution (prevent multiple executions for same rule/event/date)
        const duplicateKey = `${execution.rule_id}-${execution.event_id || 'no-event'}-${execution.execution_date}`;
        const existingDuplicate = existingExecutions?.find(e => 
          e.rule_id === execution.rule_id && 
          e.event_id === execution.event_id && 
          e.execution_date === execution.execution_date &&
          e.id !== execution.id &&
          ['processing', 'pending_approval', 'approved', 'completed'].includes(e.status)
        );

        if (existingDuplicate) {
          console.log(`⚠️ Duplicate execution detected for ${duplicateKey}, skipping execution ${execution.id}`);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'cancelled',
              error_message: `Duplicate execution - another execution exists for this rule/event/date (ID: ${existingDuplicate.id})`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
          continue;
        }
        
        // Mark as processing
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', execution.id);

        // Validate execution has required data
        if (!execution.auto_gifting_rules) {
          console.error(`❌ Missing rule data for execution ${execution.id}`);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: 'Auto-gifting rule no longer exists or is invalid',
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
          continue;
        }

        const rule = execution.auto_gifting_rules;

        // ✨ Handle both registered recipients AND pending invitations
        const isPendingInvitation = !rule.recipient_id && rule.pending_recipient_email;

        console.log(`🎁 Processing gift - Type: ${isPendingInvitation ? 'PENDING INVITATION' : 'REGISTERED'}, Budget: ${rule.budget_limit}, Occasion: ${rule.date_type}`);

        try {
          let recipientProfile = null;
          let selectedProducts = [];

          // Path A: Registered recipient (existing logic)
          if (rule.recipient_id) {
            console.log(`✅ Registered recipient: ${rule.recipient_id}`);
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', rule.recipient_id)
              .single();

            if (profileError || !profile) {
              throw new Error(`Failed to fetch recipient profile: ${profileError?.message}`);
            }
            
            recipientProfile = profile;

            // Get recipient's wishlists (should work with updated RLS policy)
            const { data: wishlists, error: wishlistError } = await supabase
              .from('wishlists')
              .select(`
                *,
                wishlist_items (
                  *
                )
              `)
              .eq('user_id', rule.recipient_id);

            if (wishlistError) {
              console.error(`❌ Error fetching wishlists:`, wishlistError);
              throw new Error(`Failed to fetch recipient wishlists: ${wishlistError.message}`);
            }

            console.log(`📋 Found ${wishlists?.length || 0} wishlists for recipient`);
            
            // Collect all wishlist items within budget
            const allWishlistItems = [];
            for (const wishlist of wishlists || []) {
              for (const item of wishlist.wishlist_items || []) {
                if (item.price && item.price <= (rule.budget_limit || 50)) {
                  allWishlistItems.push({
                    ...item,
                    wishlist_title: wishlist.title
                  });
                }
              }
            }

            console.log(`🛍️ Found ${allWishlistItems.length} wishlist items within budget`);
            
            if (allWishlistItems.length > 0) {
              // Sort by price to find best budget combination
              allWishlistItems.sort((a, b) => (b.price || 0) - (a.price || 0));
              
              // Simple budget optimization: try to get close to budget limit
              let totalCost = 0;
              const budgetLimit = rule.budget_limit || 50;
              
              for (const item of allWishlistItems) {
                if (totalCost + (item.price || 0) <= budgetLimit) {
                  selectedProducts.push({
                    id: item.id,
                    product_id: item.product_id || item.id,
                    title: item.product_name,
                    product_name: item.product_name,
                    name: item.product_name,
                    price: item.price,
                    image: item.image_url,
                    image_url: item.image_url,
                    source: 'wishlist',
                    vendor: 'Wishlist',
                    category: item.category,
                    brand: item.brand,
                    wishlist_title: item.wishlist_title,
                    description: item.description || `From ${item.wishlist_title || 'wishlist'}`,
                    product_details: item.product_details,
                    features: item.features
                  });
                  totalCost += item.price || 0;
                  
                  if (totalCost >= budgetLimit * 0.85) break;
                }
              }
              
              console.log(`💰 Selected ${selectedProducts.length} products totaling $${totalCost.toFixed(2)}`);
            } else {
              console.log(`📝 No wishlist items, checking invitation context...`);
              
              const invitationContext = await getInvitationContext(userId, rule.recipient_id, supabase);
              
              if (invitationContext.isNewUser || invitationContext.isInvitedUser) {
                console.log(`🆕 Using enhanced emergency AI logic`);
                selectedProducts = await getEnhancedEmergencyProducts(
                  rule.budget_limit || 50,
                  rule.date_type,
                  invitationContext,
                  recipientProfile,
                  supabase
                );
              } else {
                selectedProducts = [{
                  id: `ai-${Date.now()}`,
                  product_id: `ai-${Date.now()}`,
                  title: `AI Recommended Gift for ${rule.date_type}`,
                  product_name: `AI Recommended Gift for ${rule.date_type}`,
                  name: `AI Recommended Gift for ${rule.date_type}`,
                  price: Math.min(rule.budget_limit || 50, 25),
                  image: null,
                  image_url: null,
                  source: 'ai_recommendation',
                  vendor: 'AI Recommendation',
                  category: rule.date_type,
                  description: `AI-generated gift suggestion for ${rule.date_type} occasion`
                }];
              }
            }
          }
          
          // Path B: Pending invitation - use emergency AI logic
          else if (isPendingInvitation) {
            console.log(`🆕 Pending invitation: ${rule.pending_recipient_email}`);
            
            // Get invitation context by email
            const invitationContext = await getInvitationContextByEmail(
              userId, 
              rule.pending_recipient_email, 
              supabase
            );
            
            // Use emergency product selection for pending recipients
            selectedProducts = await getEmergencyGiftsForPendingRecipient(
              rule.budget_limit || 50,
              rule.date_type,
              invitationContext,
              rule.pending_recipient_email,
              supabase
            );
            
            console.log(`🎁 Emergency AI selected ${selectedProducts.length} gifts for pending recipient`);
          }
          
          else {
            throw new Error('Invalid rule: Missing both recipient_id and pending_recipient_email');
          }

          // Check auto-approve setting
          const { data: settings } = await supabase
            .from('auto_gifting_settings')
            .select('auto_approve_gifts')
            .eq('user_id', userId)
            .single();

          const shouldAutoApprove = settings?.auto_approve_gifts || false;
          const finalStatus = shouldAutoApprove ? 'approved' : 'pending_approval';

          // Update execution with selected products
          const { data: updateResult, error: updateError } = await supabase
            .from('automated_gift_executions')
            .update({
              status: finalStatus,
              selected_products: selectedProducts,
              total_amount: selectedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
              updated_at: new Date().toISOString(),
              ai_agent_source: {
                agent: 'nicole',
                data_sources: selectedProducts.map((p: any) => p.source),
                confidence_score: 0.85,
                discovery_method: 'wishlist_optimization'
              }
            })
            .eq('id', execution.id)
            .select();

          if (updateError) {
            console.error(`❌ Failed to update execution ${execution.id}:`, updateError);
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          console.log(`✅ Successfully processed execution ${execution.id} with ${selectedProducts.length} products`);

          // Send automatic approval email if pending approval (not auto-approved)
          if (finalStatus === 'pending_approval' && selectedProducts.length > 0) {
            console.log(`📧 Sending auto-approval email for execution ${execution.id}`);
            
            try {
              // Get recipient details
              let recipientEmail = rule.pending_recipient_email;
              let recipientName = 'Friend';
              
              if (rule.recipient_id && recipientProfile) {
                recipientEmail = recipientEmail || recipientProfile.email;
                recipientName = recipientProfile.full_name || recipientProfile.username || 'Friend';
              }
              
              // Get user (gift giver) details for the email
              const { data: giverProfile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', userId)
                .single();
              
              if (giverProfile?.email) {
                // Invoke the email orchestrator to send approval email
                const emailResult = await supabase.functions.invoke('ecommerce-email-orchestrator', {
                  body: {
                    eventType: 'auto_gift_approval',
                    userId: userId,
                    customData: {
                      executionId: execution.id,
                      recipientEmail: giverProfile.email, // Send to the giver, not recipient
                      recipientName: recipientName,
                      occasion: rule.date_type,
                      suggested_gifts: selectedProducts.slice(0, 3).map((p: any) => ({
                        name: p.title || p.product_name || p.name,
                        price: p.price,
                        image_url: p.image || p.image_url
                      })),
                      total_budget: rule.budget_limit || 50,
                      approve_url: `https://dmkxtkvlispxeqfzlczr.supabase.co/approve-gift/${execution.id}`,
                      reject_url: `https://dmkxtkvlispxeqfzlczr.supabase.co/reject-gift/${execution.id}`
                    }
                  }
                });
                
                if (emailResult.error) {
                  console.error(`❌ Failed to send approval email for execution ${execution.id}:`, emailResult.error);
                } else {
                  console.log(`✅ Auto-approval email sent successfully for execution ${execution.id}`);
                }
              }
            } catch (emailError) {
              console.error(`❌ Error sending auto-approval email for execution ${execution.id}:`, emailError);
              // Don't fail the whole execution if email fails
            }
          }

          // If auto-approved, proceed to order placement
          if (shouldAutoApprove && selectedProducts.length > 0) {
            console.log(`🛒 Auto-approved execution ${execution.id}, proceeding to order placement...`);
            
            // DON'T auto-place orders yet - just leave as 'approved' for manual order placement
            // This ensures proper order flow through the existing approve-auto-gift function
            console.log(`✅ Execution ${execution.id} auto-approved but will require manual order placement via approve-auto-gift`);
          }
          
          // Create appropriate notification
          const notificationType = shouldAutoApprove ? 'gift_auto_approved' : 'gift_suggestions_ready';
          const emailSent = finalStatus === 'pending_approval' ? ' - Approval email sent' : '';
          const title = shouldAutoApprove ? 'Gift Auto-Approved & Scheduled' : `Gift Suggestions Ready for Review${emailSent}`;
          const message = shouldAutoApprove 
            ? `Auto-approved ${selectedProducts.length} gift(s) totaling $${selectedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0).toFixed(2)}`
            : `Found ${selectedProducts.length} gift suggestions within your $${rule.budget_limit || 50} budget - approval email sent to ${giverProfile?.email || 'you'}`;

          await supabase
            .from('auto_gift_notifications')
            .insert({
              user_id: userId,
              notification_type: notificationType,
              title: title,
              message: message,
              execution_id: execution.id
            });

        } catch (processError) {
          console.error(`❌ Error in gift processing for execution ${execution.id}:`, processError);
          await supabase
            .from('automated_gift_executions')
            .update({
              status: 'failed',
              error_message: `Processing failed: ${(processError instanceof Error ? processError.message : String(processError))}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', execution.id);
        }

      } catch (executionError) {
        console.error(`❌ Error processing execution ${execution.id}:`, executionError);
        
        // Mark execution as failed
        await supabase
          .from('automated_gift_executions')
          .update({
            status: 'failed',
            error_message: `Unexpected error: ${(executionError instanceof Error ? executionError.message : String(executionError))}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', execution.id);
      }
    }

    const processedCount = executions?.length || 0;
    console.log(`✅ Completed processing ${processedCount} executions for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} auto-gift executions`,
        processedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-auto-gifts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: (error instanceof Error ? error.message : String(error)) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Get invitation context by email (for pending invitations)
async function getInvitationContextByEmail(
  userId: string, 
  recipientEmail: string, 
  supabase: any
) {
  console.log(`🔍 Getting invitation context for email: ${recipientEmail}`);
  
  try {
    // Check gift_invitation_analytics
    const { data: invitationAnalytics } = await supabase
      .from('gift_invitation_analytics')
      .select('*')
      .eq('user_id', userId)
      .ilike('recipient_email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Get connection details
    const { data: connection } = await supabase
      .from('user_connections')
      .select('relationship_type, created_at')
      .eq('user_id', userId)
      .ilike('pending_recipient_email', recipientEmail)
      .maybeSingle();
    
    // Get giftor's profile for proxy intelligence
    const { data: giftorProfile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, enhanced_gifting_history')
      .eq('id', userId)
      .single();
    
    return {
      isNewUser: true,
      isInvitedUser: true,
      isPendingInvitation: true,
      hasLimitedProfile: true,
      relationshipType: connection?.relationship_type || 'friend',
      recipientEmail: recipientEmail,
      invitationData: invitationAnalytics,
      giftorPreferences: giftorProfile?.enhanced_gift_preferences,
      giftorHistory: giftorProfile?.enhanced_gifting_history,
    };
  } catch (error) {
    console.error('❌ Error getting invitation context by email:', error);
    return {
      isNewUser: true,
      isInvitedUser: true,
      isPendingInvitation: true,
      hasLimitedProfile: true,
      relationshipType: 'friend',
      recipientEmail: recipientEmail,
    };
  }
}

// Emergency gift selection for pending recipients
async function getEmergencyGiftsForPendingRecipient(
  budget: number,
  occasion: string,
  invitationContext: any,
  recipientEmail: string,
  supabase: any
): Promise<any[]> {
  console.log(`🚨 Emergency gift selection for pending recipient: ${recipientEmail}`);
  
  // Use conservative, universally-appreciated gift categories
  const safeCategories = [
    'Gift Cards',
    'Books & Reading',
    'Gourmet Food & Snacks',
    'Home & Kitchen Essentials',
    'Self-Care & Wellness'
  ];
  
  // Return conservative emergency products
  return [
    {
      id: `emergency-${Date.now()}-1`,
      product_id: `emergency-${Date.now()}-1`,
      title: `${occasion} Gift Card`,
      product_name: `${occasion} Gift Card`,
      name: `${occasion} Gift Card`,
      price: Math.min(budget * 0.7, 50),
      image_url: null,
      source: 'emergency_ai_pending',
      vendor: 'Emergency AI Selection',
      category: 'Gift Cards',
      description: `Safe gift card option for pending recipient - ${occasion}`,
      emergency_context: {
        isPendingInvitation: true,
        recipientEmail: recipientEmail,
        relationshipType: invitationContext.relationshipType,
        occasion: occasion
      }
    }
  ];
}

// Enhanced invitation context detection for new/invited users
async function getInvitationContext(userId: string, recipientId: string, supabase: any) {
  console.log(`🔍 Analyzing invitation context for recipient ${recipientId}`);
  
  try {
    // Check if recipient is a recently invited user
    const { data: invitationAnalytics } = await supabase
      .from('gift_invitation_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('invited_user_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Check if recipient profile was created recently (within 30 days)
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('created_at, dob, enhanced_gift_preferences, enhanced_gifting_history')
      .eq('id', recipientId)
      .single();
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isNewUser = recipientProfile && new Date(recipientProfile.created_at) > thirtyDaysAgo;
    const isInvitedUser = !!invitationAnalytics;
    const hasLimitedProfile = !recipientProfile?.enhanced_gift_preferences && !recipientProfile?.enhanced_gifting_history;
    
    // Get inviter's profile for proxy intelligence
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('enhanced_gift_preferences, enhanced_gifting_history, dob')
      .eq('id', userId)
      .single();
    
    // Get connection details
    const { data: connection } = await supabase
      .from('user_connections')
      .select('relationship_type, created_at')
      .eq('user_id', userId)
      .eq('connected_user_id', recipientId)
      .single();
    
    // Calculate urgency (days until event)
    const { data: upcomingEvents } = await supabase
      .from('user_special_dates')
      .select('date, date_type')
      .eq('user_id', recipientId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1);
    
    const urgencyLevel = upcomingEvents?.[0] 
      ? Math.ceil((new Date(upcomingEvents[0].date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 30;
    
    return {
      isNewUser,
      isInvitedUser,
      hasLimitedProfile,
      relationshipType: connection?.relationship_type || 'friend',
      urgencyLevel,
      invitationData: invitationAnalytics,
      inviterPreferences: inviterProfile?.enhanced_gift_preferences,
      inviterHistory: inviterProfile?.enhanced_gifting_history,
      recipientAge: recipientProfile?.dob ? calculateAge(recipientProfile.dob) : null,
    };
  } catch (error) {
    console.error('❌ Error getting invitation context:', error);
    return {
      isNewUser: false,
      isInvitedUser: false,
      hasLimitedProfile: true,
      relationshipType: 'friend',
      urgencyLevel: 30
    };
  }
}

// Enhanced emergency product selection with invitation intelligence
async function getEnhancedEmergencyProducts(
  maxBudget: number,
  eventType: string,
  invitationContext: any,
  recipientProfile: any,
  supabase: any
) {
  console.log(`🆘 Getting enhanced emergency products with invitation context`);
  
  // Import the enhanced emergency fallback function
  const { getEmergencyFallbackProducts } = await import('./emergency-fallback.ts');
  
  // Prepare context for enhanced fallback
  const enhancedContext = {
    relationshipType: invitationContext.relationshipType,
    urgencyLevel: invitationContext.urgencyLevel,
    recipientDemographics: {
      age: invitationContext.recipientAge,
      profile_completion: invitationContext.hasLimitedProfile ? 'limited' : 'complete'
    },
    inviterPreferences: invitationContext.inviterPreferences
  };
  
  // Get enhanced emergency products
  const emergencyProducts = getEmergencyFallbackProducts(maxBudget, eventType, enhancedContext);
  
  // Try to enhance with AI if OpenAI is available
  try {
    const aiEnhancedProducts = await getAIEnhancedEmergencyProducts(
      emergencyProducts,
      invitationContext,
      recipientProfile,
      eventType,
      maxBudget
    );
    
    if (aiEnhancedProducts.length > 0) {
      console.log(`🤖 Enhanced ${emergencyProducts.length} products with AI intelligence`);
      return aiEnhancedProducts;
    }
  } catch (aiError) {
    console.log(`⚠️ AI enhancement failed, using enhanced emergency fallback:`, (aiError instanceof Error ? aiError.message : String(aiError)));
  }
  
  console.log(`✅ Returning ${emergencyProducts.length} enhanced emergency products`);
  return emergencyProducts;
}

// AI-enhanced emergency product selection for new users
async function getAIEnhancedEmergencyProducts(
  emergencyProducts: any[],
  invitationContext: any,
  recipientProfile: any,
  eventType: string,
  maxBudget: number
) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not available');
  }
  
  const prompt = `I need to find emergency gifts for someone who was recently invited to our platform and has limited profile data. Here's what I know:

RECIPIENT CONTEXT:
- Relationship: ${invitationContext.relationshipType}
- Event: ${eventType}
- Budget: $${maxBudget}
- Days until event: ${invitationContext.urgencyLevel}
- Profile status: ${invitationContext.hasLimitedProfile ? 'New/Limited' : 'Established'}
- Age: ${invitationContext.recipientAge || 'Unknown'}

INVITER'S GIFT HISTORY (for context):
${JSON.stringify(invitationContext.inviterPreferences || {}, null, 2)}

EMERGENCY PRODUCTS TO ENHANCE:
${JSON.stringify(emergencyProducts.slice(0, 5), null, 2)}

Please enhance these emergency products with:
1. More specific, personalized descriptions
2. Better reasoning for why each gift fits
3. Confidence scores (0-1) for each recommendation
4. Any additional gift ideas that would work well for this scenario

Focus on gifts that:
- Work well for the relationship type
- Are appropriate for the urgency level
- Don't require deep personal knowledge
- Are universally appreciated
- Can be delivered quickly if needed

Return as JSON array of enhanced products.`;

  try {
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
            content: 'You are Nicole, an expert gift consultant who specializes in finding perfect gifts for new users with limited profile data. Focus on universally appreciated, relationship-appropriate gifts.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    const aiData = await response.json();
    const enhancedProducts = JSON.parse(aiData.choices[0].message.content);
    
    // Process and standardize the AI response
    return enhancedProducts.map((product: any, index: number) => ({
      id: product.id || `ai-emergency-${Date.now()}-${index}`,
      product_id: product.product_id || `ai-emergency-${Date.now()}-${index}`,
      title: product.title || product.name,
      product_name: product.title || product.name,
      name: product.title || product.name,
      price: Math.min(product.price || maxBudget * 0.5, maxBudget),
      image: product.image_url || null,
      image_url: product.image_url || null,
      source: 'ai_enhanced_emergency',
      vendor: product.vendor || 'Multiple Vendors',
      category: product.category || 'General',
      description: product.description || 'AI-enhanced emergency gift recommendation',
      features: product.features || ['Perfect for the occasion', 'Thoughtfully selected'],
      availability: product.availability || 'in_stock',
      urgent_delivery: invitationContext.urgencyLevel <= 7,
      confidence_score: product.confidence_score || 0.8,
      match_reasons: product.match_reasons || ['Relationship-appropriate', 'Event-suitable'],
      emergency_context: {
        invitation_based: true,
        urgency_level: invitationContext.urgencyLevel,
        relationship_type: invitationContext.relationshipType
      }
    }));
    
  } catch (error) {
    console.error('🚨 AI enhancement failed:', error);
    throw error;
  }
}

// Helper function to calculate age
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