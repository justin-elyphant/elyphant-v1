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

// Process best seller indicators from Zinc response
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

  // Check for Best Seller rank/badge
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

  // Check for high sales volume indicators
  if (product.num_sales && product.num_sales > 1000) {
    isBestSeller = true;
    bestSellerType = bestSellerType || 'popular';
    badgeText = badgeText || 'Popular';
  }

  // Check for badge text in various fields
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

// Luxury category search handler
const searchLuxuryCategories = async (api_key: string, page: number = 1) => {
  console.log('Starting luxury category batch search');
  
  const luxuryCategories = [
    "top designer bags for women",
    "top designer sunglasses", 
    "luxury watches",
    "designer jewelry"
  ];
  
  const promises = luxuryCategories.map(async (category) => {
    try {
      console.log(`Searching luxury category: ${category}`);
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(category)}&page=1&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        // Take first 3-4 products from each category
        const categoryResults = data.results.slice(0, 4).map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return {
            ...product,
            ...bestSellerData,
            categorySource: category // Track which category this came from
          };
        });
        
        console.log(`Found ${categoryResults.length} products for category: ${category}`);
        return categoryResults;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching category ${category}:`, error);
      return [];
    }
  });
  
  try {
    const categoryResults = await Promise.all(promises);
    
    // Flatten and mix results
    const allResults = categoryResults.flat();
    
    // Shuffle to prevent category clustering
    for (let i = allResults.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allResults[i], allResults[j]] = [allResults[j], allResults[i]];
    }
    
    console.log(`Luxury category search complete: ${allResults.length} total products`);
    
    return {
      results: allResults,
      total: allResults.length,
      categoryBatch: true
    };
    
  } catch (error) {
    console.error('Error in luxury category batch search:', error);
    throw error;
  }
};

// Gifts for Her category search handler with pagination support
// Shared category batch search utility
const searchCategoryBatch = async (
  api_key: string, 
  categories: string[], 
  batchName: string,
  page: number = 1, 
  limit: number = 20,
  priceFilter?: { max?: number; min?: number }
) => {
  console.log(`Starting ${batchName} category batch search - page ${page}, limit ${limit}`);
  
  const productsPerCategory = Math.ceil(limit / categories.length);
  
  const promises = categories.map(async (category, index) => {
    try {
      const actualPage = page + Math.floor(index / 3); // Stagger pages across categories
      let query = encodeURIComponent(category);
      
      // Add price filtering for budget categories
      if (priceFilter?.max) {
        query += `&max_price=${priceFilter.max}`;
      }
      if (priceFilter?.min) {
        query += `&min_price=${priceFilter.min}`;
      }
      
      console.log(`Searching ${batchName} category: ${category} (page ${actualPage})`);
      const response = await fetch(`https://api.zinc.io/v1/search?query=${query}&page=${actualPage}&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        const startIndex = page === 1 ? 0 : (page - 1) * 2;
        const endIndex = startIndex + productsPerCategory;
        let categoryResults = data.results.slice(startIndex, endIndex);
        
        // Additional price filtering for budget categories
        if (priceFilter?.max) {
          categoryResults = categoryResults.filter((product: any) => {
            const price = parseFloat(product.price) || 0;
            return price <= priceFilter.max!;
          });
        }
        
        const processedResults = categoryResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return {
            ...product,
            ...bestSellerData,
            categorySource: category
          };
        });
        
        console.log(`Found ${processedResults.length} products for category: ${category}`);
        return processedResults;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching category ${category}:`, error);
      return [];
    }
  });
  
  try {
    const categoryResults = await Promise.all(promises);
    const allResults = categoryResults.flat();
    
    // Shuffle to prevent category clustering
    for (let i = allResults.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allResults[i], allResults[j]] = [allResults[j], allResults[i]];
    }
    
    const paginatedResults = allResults.slice(0, limit);
    
    console.log(`${batchName} category search complete: ${paginatedResults.length} products returned (page ${page})`);
    
    return {
      results: paginatedResults,
      total: paginatedResults.length,
      hasMore: allResults.length > limit || page <= 5,
      currentPage: page,
      categoryBatch: true
    };
    
  } catch (error) {
    console.error(`Error in ${batchName} category batch search:`, error);
    throw error;
  }
};

// Gifts for Her category search handler
const searchGiftsForHerCategories = async (api_key: string, page: number = 1, limit: number = 20) => {
  const giftsForHerCategories = [
    "skincare essentials for women",
    "cozy sweaters and cardigans", 
    "candles and home fragrance",
    "books and reading accessories",
    "yoga and fitness accessories",
    "coffee and tea gifts"
  ];
  
  return searchCategoryBatch(api_key, giftsForHerCategories, "gifts for her", page, limit);
};

// Gifts for Him category search handler
const searchGiftsForHimCategories = async (api_key: string, page: number = 1, limit: number = 20) => {
  const giftsForHimCategories = [
    "tech gadgets for men",
    "grooming essentials",
    "fitness and sports gear",
    "watches and accessories", 
    "tools and gadgets",
    "gaming accessories"
  ];
  
  return searchCategoryBatch(api_key, giftsForHimCategories, "gifts for him", page, limit);
};

// Gifts Under $50 category search handler
const searchGiftsUnder50Categories = async (api_key: string, page: number = 1, limit: number = 20) => {
  const giftsUnder50Categories = [
    "affordable tech accessories",
    "budget home decor",
    "inexpensive jewelry",
    "affordable beauty products",
    "budget kitchen gadgets",
    "affordable fitness accessories"
  ];
  
  return searchCategoryBatch(api_key, giftsUnder50Categories, "gifts under $50", page, limit, { max: 50 });
};

serve(async (req) => {
  const {method} = req;
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (method === 'POST') {
    const api_key = await fetchApiKey();
    console.log('api_key', api_key);
    if(!api_key) {
      return new Response('API key not found', { status: 404 });
    }
    
    const {query, retailer = "amazon", page = 1, limit = 20, luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false} = await req.json();
    
    try {
      // Handle luxury category batch search
      if (luxuryCategories) {
        console.log('Processing luxury category batch request');
        const luxuryData = await searchLuxuryCategories(api_key, page);
        
        return new Response(JSON.stringify(luxuryData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for her category batch search
      if (giftsForHer) {
        console.log('Processing gifts for her category batch request');
        const giftsForHerData = await searchGiftsForHerCategories(api_key, page, limit);
        
        return new Response(JSON.stringify(giftsForHerData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for him category batch search
      if (giftsForHim) {
        console.log('Processing gifts for him category batch request');
        const giftsForHimData = await searchGiftsForHimCategories(api_key, page, limit);
        
        return new Response(JSON.stringify(giftsForHimData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts under $50 category batch search
      if (giftsUnder50) {
        console.log('Processing gifts under $50 category batch request');
        const giftsUnder50Data = await searchGiftsUnder50Categories(api_key, page, limit);
        
        return new Response(JSON.stringify(giftsUnder50Data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Existing single search logic (preserved exactly)
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=${retailer}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
  
      const data = await response.json();
      
      // Process best seller data for each product
      if (data.results && Array.isArray(data.results)) {
        data.results = data.results.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return {
            ...product,
            ...bestSellerData
          };
        });
      }
  
      return new Response(JSON.stringify(data), {
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
