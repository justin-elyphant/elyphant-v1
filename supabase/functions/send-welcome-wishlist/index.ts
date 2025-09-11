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
  appBaseUrl?: string;
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

    // Use Enhanced Zinc API to get real product recommendations
    let recommendationsData: any = null;
    try {
      console.log('🔍 Calling Enhanced Zinc API for real product recommendations...');
      
      // First, try category-based Zinc search under $75 for broad coverage
      const zincRequestBase: any = { limit: 24, page: 1, filters: { min_price: 15, max_price: 75 } };

      let zincData: any = null; 
      let zincError: any = null;

      // Attempt 1: Gifts under $50 category batch (high chance of real images)
      const attempt1 = await supabase.functions.invoke('get-products', {
        body: { ...zincRequestBase, giftsUnder50: true }
      });
      zincData = attempt1.data; zincError = attempt1.error;

      // Attempt 2: Keyword search using interests if attempt 1 yields nothing
      if (!zincError && (!zincData?.results || zincData.results.length === 0)) {
        const attempt2 = await supabase.functions.invoke('get-products', {
          body: {
            ...zincRequestBase,
            query: `${recommendationContext.interests?.join(' ') || 'popular'} gifts ${recommendationContext.occasion || 'welcome'}`
          }
        });
        zincData = attempt2.data; zincError = attempt2.error;
      }

      if (zincError) {
        console.error('❌ Zinc API Error:', zincError);
        throw zincError;
      }

      console.log('🔍 Raw Zinc API Response Debug:', JSON.stringify({
        hasResults: !!zincData?.results,
        resultsCount: zincData?.results?.length || 0,
        firstProductKeys: zincData?.results?.[0] ? Object.keys(zincData.results[0]) : [],
        firstProductImages: zincData?.results?.[0] ? {
          image: zincData.results[0].image,
          main_image: zincData.results[0].main_image,
          images: zincData.results[0].images,
          thumbnail: zincData.results[0].thumbnail
        } : null
      }));

      if (zincData?.results && zincData.results.length > 0) {
        // Transform Zinc API results to ProductRecommendation format
        const transformedRecommendations: ProductRecommendation[] = zincData.results.map((product: any, index: number) => {
          // Robust price normalization
          let priceCandidate: any = product.price;
          if (priceCandidate == null || priceCandidate === 0) {
            priceCandidate = product.price_cents ?? product.offer_price_cents ?? product.sale_price_cents ?? product.list_price_cents ?? product.current_price ?? product.list_price ?? product.price_string;
          }
          let normalizedPrice = 0;
          if (typeof priceCandidate === 'number') {
            normalizedPrice = priceCandidate > 100 ? priceCandidate / 100 : priceCandidate;
          } else if (typeof priceCandidate === 'string') {
            const num = parseFloat(priceCandidate.replace(/[$,]/g, ''));
            normalizedPrice = isNaN(num) ? 0 : (num > 100 ? num / 100 : num);
          }
          if (!normalizedPrice || normalizedPrice < 0) normalizedPrice = 0;

          // Choose best available image from multiple possible fields
          const candidateImages = [
            product.image,
            product.main_image,
            product.mainImage,
            product.primary_image,
            product.image_url,
            ...(Array.isArray(product.images) ? product.images : []),
            ...(Array.isArray(product.additional_images) ? product.additional_images : []),
            product.thumbnail
          ].filter(Boolean);

          const rawImage: any = candidateImages.find((u: any) => typeof u === 'string' && (u.startsWith('http') || u.startsWith('//'))) || candidateImages[0] || null;
          let normalizedImage = rawImage as string | null;
          if (normalizedImage) {
            if (normalizedImage.startsWith('//')) normalizedImage = 'https:' + normalizedImage;
            normalizedImage = normalizedImage.replace(/^http:/, 'https:');
          }

          console.log(`🖼️ Image Debug for "${product.title}":`, {
            hasImage: !!normalizedImage,
            rawImage,
            normalizedImage,
            allCandidates: candidateImages
          });

          return ({
            productId: product.product_id || `zinc-${Date.now()}-${index}`,
            title: product.title || 'Great Gift Item',
            description: product.description || product.product_description || 'Perfect gift for any occasion',
            price: normalizedPrice,
            vendor: product.vendor || product.retailer || 'Amazon',
            imageUrl: normalizedImage,
            category: product.category || 'General',
            matchScore: 0.8 + (Math.random() * 0.15), // High confidence for real products
            matchReasons: [`Real product from ${product.vendor || 'marketplace'}`, 'Curated by Nicole AI'],
            purchaseUrl: product.url || product.product_url || null,
            availability: 'in_stock'
          });
        }).filter((rec: ProductRecommendation) => rec.price && rec.price > 0).slice(0, 24);

        // Build final list preferring items with live images
        const withImages = transformedRecommendations.filter(r => !!r.imageUrl);
        const withoutImages = transformedRecommendations.filter(r => !r.imageUrl);

        const categoryFallback = (cat: string) => {
          const c = (cat || '').toLowerCase();
          if (c.includes('tech') || c.includes('electron')) return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=400&fit=crop&auto=format&q=80';
          if (c.includes('home') || c.includes('blanket') || c.includes('bedding')) return 'https://images.unsplash.com/photo-1559123830-6ec229bc5ba7?w=400&h=400&fit=crop&auto=format&q=80';
          if (c.includes('wellness') || c.includes('candle')) return 'https://images.unsplash.com/photo-1602874801006-2b5e0b9a9b3e?w=400&h=400&fit=crop&auto=format&q=80';
          if (c.includes('kitchen') || c.includes('mug') || c.includes('cook')) return 'https://images.unsplash.com/photo-1524511119869-32e3a0e24733?w=400&h=400&fit=crop&auto=format&q=80';
          return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format&q=80';
        };

        const completed = [...withImages, ...withoutImages.map(r => ({ ...r, imageUrl: categoryFallback(r.category) }))];
        const finalRecommendations = completed.slice(0, 12);

        // Ensure we have something to send; otherwise fall back to curated list
        if (!finalRecommendations.length) {
          console.warn('⚠️ No products with or without images after transform; switching to curated fallback');
          throw new Error('No usable products after transformation');
        }

        recommendationsData = {
          recommendations: finalRecommendations,
          confidence_score: 0.85,
          fallback_used: false,
          source: 'enhanced_zinc_api'
        };

        console.log('✅ Successfully fetched real products from Enhanced Zinc API:', finalRecommendations.length);
      } else {
        throw new Error('No products returned from Enhanced Zinc API');
      }

    } catch (zincErr: any) {
      console.warn('⚠️ Enhanced Zinc API unavailable, using curated fallback. Reason:', zincErr?.message || zincErr);
      
      // Fallback to high-quality curated products with real images
      const fallback: ProductRecommendation[] = [
        { productId: 'curated-1', title: 'Premium Insulated Water Bottle', description: 'Stainless steel, keeps drinks cold 24hrs/hot 12hrs', price: 29.99, vendor: 'Hydro Flask', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=640&q=80', category: 'Lifestyle', matchScore: 0.82, matchReasons: ['Premium quality', 'High user ratings'] },
        { productId: 'curated-2', title: 'Luxury Weighted Throw Blanket', description: 'Ultra-soft bamboo fabric, reduces anxiety', price: 45.00, vendor: 'YnM', imageUrl: 'https://images.unsplash.com/photo-1559123830-6ec229bc5ba7?w=640&q=80', category: 'Home', matchScore: 0.8, matchReasons: ['Wellness benefits', 'Premium materials'] },
        { productId: 'curated-3', title: 'Organic Soy Candle Set', description: 'Hand-poured with essential oils, 40hr burn time', price: 32.50, vendor: 'Paddywax', imageUrl: 'https://images.unsplash.com/photo-1602874801006-2b5e0b9a9b3e?w=640&q=80', category: 'Wellness', matchScore: 0.79, matchReasons: ['Eco-friendly', 'Artisan quality'] },
        { productId: 'curated-4', title: 'Wireless Charging Pad', description: 'Fast charging for all Qi-enabled devices', price: 24.99, vendor: 'Anker', imageUrl: 'https://images.unsplash.com/photo-1609592167934-b5da2bc5da84?w=640&q=80', category: 'Tech', matchScore: 0.76, matchReasons: ['Universal compatibility', 'Trusted brand'] },
        { productId: 'curated-5', title: 'Artisan Ceramic Mug Set', description: 'Handcrafted stoneware, microwave safe', price: 28.00, vendor: 'East Fork', imageUrl: 'https://images.unsplash.com/photo-1524511119869-32e3a0e24733?w=640&q=80', category: 'Kitchen', matchScore: 0.78, matchReasons: ['Artisan crafted', 'Daily usability'] },
        { productId: 'curated-6', title: 'Bullet Journal Starter Kit', description: 'Dotted notebook with accessories', price: 19.99, vendor: 'Rocketbook', imageUrl: 'https://images.unsplash.com/photo-1526052694-c37d4eb5a8e1?w=640&q=80', category: 'Stationery', matchScore: 0.75, matchReasons: ['Productivity tool', 'Creative outlet'] }
      ];
      recommendationsData = { recommendations: fallback, confidence_score: 0.65, fallback_used: true, source: 'curated_fallback' };
    }

    console.log('✅ Generated recommendations:', {
      count: recommendationsData?.recommendations?.length || 0,
      confidence: recommendationsData?.confidence_score || 0
    });

    // Prepare app URL - ensure we use the production domain
    const appUrl = request.appBaseUrl && request.appBaseUrl.includes('elyphant.ai') 
      ? request.appBaseUrl 
      : 'https://elyphant.ai';
    
    // Transform recommendations into email format
    console.log('🔍 Debug - recommendations data:', JSON.stringify({
      recommendationsExists: !!recommendationsData?.recommendations,
      recommendationsCount: recommendationsData?.recommendations?.length || 0,
      firstRecommendation: recommendationsData?.recommendations?.[0] || null
    }));

    const emailRecommendations = (recommendationsData?.recommendations || [])
      .slice(0, 6) // Show top 6 recommendations
      .map((rec: ProductRecommendation) => ({
        id: rec.productId,
        title: rec.title,
        description: rec.description || `${rec.category} item from ${rec.vendor}`,
        price: rec.price,
        imageUrl: rec.imageUrl && rec.imageUrl !== 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop' 
          ? rec.imageUrl 
          : `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format&q=80`,
        category: rec.category,
        matchReason: rec.matchReasons?.[0] || 'Highly rated and popular choice',
        addToWishlistUrl: `${appUrl}/wishlist/add?productId=${rec.productId}&title=${encodeURIComponent(rec.title)}&price=${rec.price}&source=welcome_email&retailer=amazon`
      }));

    console.log('📧 Email recommendations prepared:', emailRecommendations.length);
    
    // Prepare email data
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
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" width="80" height="80" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0; display: block;" referrerpolicy="no-referrer">` : ''}
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