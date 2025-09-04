import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeWishlistRequest {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName?: string;
  birthYear?: number;
  interests?: string[];
  inviterName?: string;
  profileData?: {
    gender?: string;
    lifestyle?: string;
    favoriteCategories?: string[];
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: WelcomeWishlistRequest = await req.json();
    console.log('🎁 Processing welcome wishlist request for user:', request.userId);

    // Generate AI-powered recommendations using the existing edge function
    const recommendationContext = {
      recipient: request.userFirstName,
      relationship: 'self',
      occasion: 'welcome_signup',
      interests: request.interests || ['general', 'popular', 'trending'],
      recipientAge: request.birthYear ? new Date().getFullYear() - request.birthYear : 25,
      gender: request.profileData?.gender || 'any',
      lifestyle: request.profileData?.lifestyle || 'modern',
      giftType: 'wishlist_based' as const,
      urgency: 'low' as const
    };

    console.log('🤖 Generating recommendations with context:', recommendationContext);

    // Call the existing enhanced-gift-recommendations function
    const { data: recommendationsData, error: recommendationsError } = await supabase.functions.invoke(
      'enhanced-gift-recommendations',
      {
        body: {
          searchContext: recommendationContext,
          recipientIdentifier: request.userId,
          options: {
            maxRecommendations: 8,
            includeExplanations: true,
            fallbackToGeneric: true,
            priceRange: [15, 75] // Starter-friendly price range
          }
        }
      }
    );

    if (recommendationsError) {
      console.error('❌ Failed to generate recommendations:', recommendationsError);
      throw new Error(`Recommendation generation failed: ${recommendationsError.message}`);
    }

    console.log('✅ Generated recommendations:', {
      count: recommendationsData?.recommendations?.length || 0,
      confidence: recommendationsData?.confidence_score || 0
    });

    // Transform recommendations into email format
    const emailRecommendations = (recommendationsData?.recommendations || [])
      .slice(0, 6) // Show top 6 recommendations
      .map((rec: ProductRecommendation) => ({
        id: rec.productId,
        title: rec.title,
        description: rec.description || `${rec.category} item from ${rec.vendor}`,
        price: rec.price,
        imageUrl: rec.imageUrl,
        category: rec.category,
        matchReason: rec.matchReasons?.[0] || 'Highly rated and popular choice',
        addToWishlistUrl: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://elyphant.lovableproject.com'}/marketplace?add_to_wishlist=${rec.productId}&source=welcome_email`
      }));

    // Prepare email data
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://elyphant.lovableproject.com';
    
    const emailData = {
      userFirstName: request.userFirstName,
      userEmail: request.userEmail,
      inviterName: request.inviterName,
      recommendations: emailRecommendations,
      marketplaceUrl: `${appUrl}/marketplace?source=welcome_email`,
      profileUrl: `${appUrl}/profile?source=welcome_email`
    };

    console.log('📧 Sending welcome wishlist email...');

    // Send the email using the existing email notification function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke(
      'send-email-notification',
      {
        body: {
          recipientEmail: request.userEmail,
          subject: `${request.inviterName ? `${request.inviterName} invited you - ` : ''}Nicole picked these just for you! 🎁`,
          htmlContent: generateWelcomeWishlistEmailContent(emailData),
          recipientName: request.userFirstName,
          notificationType: 'welcome_wishlist'
        }
      }
    );

    if (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    // Track the welcome email analytics
    await supabase.from('email_analytics').insert({
      recipient_email: request.userEmail,
      template_type: 'welcome_wishlist',
      delivery_status: 'sent',
      sent_at: new Date().toISOString()
    });

    console.log('✅ Welcome wishlist email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome wishlist email sent successfully',
        recommendationsCount: emailRecommendations.length,
        confidenceScore: recommendationsData?.confidence_score || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Welcome wishlist function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process welcome wishlist request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

function generateWelcomeWishlistEmailContent(data: any): string {
  const inviterMessage = data.inviterName 
    ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>💫 Welcome from ${data.inviterName}!</strong><br>Since ${data.inviterName} invited you to Elyphant, I thought you'd love to see some gift ideas they might enjoy too!</p>`
    : '';

  const productCards = data.recommendations.map((product: any) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 15px 0; background: white;">
      <div style="display: flex; align-items: start; gap: 15px;">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">` : ''}
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 16px; font-weight: 600;">${product.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${product.description}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <div>
              <span style="color: #8B5CF6; font-weight: 600; font-size: 18px;">$${product.price}</span>
              <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${product.category}</span>
            </div>
            <a href="${product.addToWishlistUrl}" style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Add to Wishlist</a>
          </div>
          <p style="margin: 8px 0 0 0; color: #059669; font-size: 12px; font-style: italic;">💡 ${product.matchReason}</p>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Starter Wishlist is Ready!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .button { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 10px 5px; }
        .secondary-button { background: white; color: #8B5CF6; border: 2px solid #8B5CF6; padding: 10px 22px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 10px 5px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 12px 12px; }
        .stats-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        @media (max-width: 600px) {
          .container { padding: 10px; }
          .content { padding: 20px; }
          .button, .secondary-button { display: block; margin: 10px 0; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Welcome to Elyphant, ${data.userFirstName}!</h1>
          <p>Nicole here! I've curated a special starter wishlist just for you 🎁</p>
        </div>
        
        <div class="content">
          ${inviterMessage}
          
          <p>Welcome to the future of gift-giving! I'm Nicole, your AI gift assistant, and I'm thrilled you've joined our community. To get you started, I've hand-picked some amazing items that I think you'll love.</p>
          
          <div class="stats-box">
            <h3 style="margin: 0 0 10px 0; color: #374151;">🎯 Your Starter Collection</h3>
            <p style="margin: 0; color: #6b7280;">Curated based on popular trends and diverse interests</p>
          </div>

          <h2 style="color: #374151; margin: 30px 0 20px 0;">Nicole's Welcome Picks for You</h2>
          
          ${productCards}
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data.marketplaceUrl}" class="button">Explore Full Marketplace</a>
            <a href="${data.profileUrl}" class="secondary-button">Complete Your Profile</a>
          </div>
          
          <div style="background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">💡 Pro Tips for New Users:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li>Add items to your wishlist so friends and family know what you'd love</li>
              <li>Connect with friends to see their wishlists and get gift inspiration</li>
              <li>Use Nicole (that's me!) anytime you need gift recommendations</li>
              <li>Set up auto-gifting for important dates so you never miss an occasion</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This is just the beginning! As you use Elyphant more, I'll learn your preferences and provide even better recommendations. Questions? Just reply to this email - I'm always here to help! 💜
          </p>
        </div>
        
        <div class="footer">
          <p>This email was sent by Nicole, your AI Gift Assistant</p>
          <p>© ${new Date().getFullYear()} Elyphant. Making gift-giving effortless.</p>
          <p style="font-size: 12px; margin-top: 15px;">
            <a href="#" style="color: #6b7280; text-decoration: none;">Unsubscribe</a> | 
            <a href="#" style="color: #6b7280; text-decoration: none;">Update Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);