
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchApiKey = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') 
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing environment variables for Supabase connection')
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
  .from('api_keys')
  .select('key')
  .limit(1)
  .single();
  
  if(error) {
    console.error('Error fetching API key: ', error);
    return null;
  }
  return data.key;
}

// Process best seller indicators from detailed product response
const processBestSellerData = (product: any) => {
  let isBestSeller = false;
  let bestSellerType = null;
  let badgeText = null;

  // Check for Amazon's Choice badge
  if (product.is_amazon_choice || 
      product.amazon_choice || 
      product.choice_badge ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('choice') || 
        badge?.toLowerCase().includes('amazon')))) {
    isBestSeller = true;
    bestSellerType = 'amazon_choice';
    badgeText = "Amazon's Choice";
  }

  // Check for Best Seller indicators
  if (product.is_best_seller ||
      product.best_seller ||
      product.bestseller ||
      (product.badges && product.badges.some((badge: any) => 
        badge?.toLowerCase().includes('best') && badge?.toLowerCase().includes('seller'))) ||
      (product.best_seller_rank && product.best_seller_rank <= 100)) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'best_seller';
    badgeText = badgeText || 'Best Seller';
  }

  // Check sales rank for popular items
  if (product.sales_rank && product.sales_rank <= 50) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'top_rated';
    badgeText = badgeText || 'Top Rated';
  }

  // Check for high review count + rating combination
  if (product.num_reviews && product.num_reviews > 500 && 
      product.rating && product.rating >= 4.5) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'highly_rated';
    badgeText = badgeText || 'Highly Rated';
  }

  // Check for badge text in product details
  if (product.badge_text) {
    const badgeTextLower = product.badge_text.toLowerCase();
    if (badgeTextLower.includes('choice') || badgeTextLower.includes('best') || badgeTextLower.includes('seller')) {
      isBestSeller = true;
      bestSellerType = badgeTextLower.includes('choice') ? 'amazon_choice' : 'best_seller';
      badgeText = product.badge_text;
    }
  }

  return {
    isBestSeller,
    bestSellerType,
    badgeText
  };
};

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    const api_key = await fetchApiKey();
    if(!api_key) {
      return new Response('API key not found', { status: 404 });
    }
    const {product_id, retailer} = await req.json();
    try {
      const response = await fetch(`https://api.zinc.io/v1/products/${product_id}?retailer=${retailer}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });

      const data = await response.json();
      
      // Process best seller data for the product detail
      const bestSellerData = processBestSellerData(data);
      const enhancedData = {
        ...data,
        ...bestSellerData
      };

      return new Response(JSON.stringify(enhancedData), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });      
    } catch(error) {
      console.log('Error', error);
      return new Response(
        JSON.stringify({success: false, message: 'Internal server error.'}), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
  }
})
