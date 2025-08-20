import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchApiKey = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') 
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for Supabase connection')
  }
  
  // Use service role key for system access to API keys
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
const searchLuxuryCategories = async (api_key: string, page: number = 1, priceFilter?: { min?: number; max?: number }) => {
  console.log('Starting luxury category batch search with price filter:', priceFilter);
  
  const luxuryCategories = [
    "top designer bags for women",
    "top designer sunglasses", 
    "luxury watches",
    "designer jewelry"
  ];
  
  return searchCategoryBatch(api_key, luxuryCategories, "luxury items", page, 16, priceFilter);
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
      
      // Build URL with proper parameters
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(category)}&page=${actualPage}&retailer=amazon`;
      
      // Try different parameter formats for price filtering
      if (priceFilter?.max) {
        // Try both parameter formats that Zinc might accept
        searchUrl += `&max_price=${priceFilter.max}&price_max=${priceFilter.max}`;
      }
      if (priceFilter?.min) {
        searchUrl += `&min_price=${priceFilter.min}&price_min=${priceFilter.min}`;
      }
      
      console.log(`Searching ${batchName} category: ${category} (page ${actualPage})`);
      console.log(`Search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      
      const data = await response.json();
      console.log(`API Response for ${category}:`, JSON.stringify(data, null, 2));
      
      if (data.results && Array.isArray(data.results)) {
        const startIndex = page === 1 ? 0 : (page - 1) * 2;
        const endIndex = startIndex + productsPerCategory;
        let categoryResults = data.results.slice(startIndex, endIndex);
        
        // Additional price filtering for budget categories - try multiple price field formats
        if (priceFilter?.max) {
          categoryResults = categoryResults.filter((product: any) => {
            // Zinc API returns prices in dollars - extract price value
            let price = 0;
            if (product.price) {
              if (typeof product.price === 'string') {
                price = parseFloat(product.price.replace(/[$,]/g, ''));
              } else if (typeof product.price === 'number') {
                price = product.price;
              }
            } else if (product.price_amount) {
              price = product.price_amount;
            }
            
            const isUnderBudget = price > 0 && price <= priceFilter.max!;
            console.log(`Product: ${product.title}, Original Price: ${product.price}, Converted Price: ${price}, Max: ${priceFilter.max}, Under Budget: ${isUnderBudget}`);
            return isUnderBudget;
          });
        }
        
        const processedResults = categoryResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          
          // Normalize price from cents to dollars
          let normalizedPrice = product.price;
          if (typeof product.price === 'number' && product.price > 100) {
            normalizedPrice = product.price / 100;
            console.log(`🔄 Category price conversion: "${product.title}" - Original: ${product.price} cents → Converted: $${normalizedPrice}`);
          } else if (typeof product.price === 'string') {
            const numericPrice = parseFloat(product.price.replace(/[$,]/g, ''));
            if (numericPrice > 100) {
              normalizedPrice = numericPrice / 100;
              console.log(`🔄 Category price conversion (string): "${product.title}" - Original: ${product.price} → Converted: $${normalizedPrice}`);
            } else {
              normalizedPrice = numericPrice;
            }
          }
          
          return {
            ...product,
            ...bestSellerData,
            categorySource: category,
            price: normalizedPrice
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
const searchGiftsForHerCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsForHerCategories = [
    "skincare essentials for women",
    "cozy sweaters and cardigans", 
    "candles and home fragrance",
    "books and reading accessories",
    "yoga and fitness accessories",
    "coffee and tea gifts"
  ];
  
  return searchCategoryBatch(api_key, giftsForHerCategories, "gifts for her", page, limit, priceFilter);
};

// Gifts for Him category search handler
const searchGiftsForHimCategories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsForHimCategories = [
    "tech gadgets for men",
    "grooming essentials",
    "fitness and sports gear",
    "watches and accessories", 
    "tools and gadgets",
    "gaming accessories"
  ];
  
  return searchCategoryBatch(api_key, giftsForHimCategories, "gifts for him", page, limit, priceFilter);
};

// Gifts Under $50 category search handler
const searchGiftsUnder50Categories = async (api_key: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  const giftsUnder50Categories = [
    "bluetooth earbuds under 50",
    "phone accessories under 50", 
    "kitchen utensils under 50",
    "skincare products under 50",
    "jewelry under 50",
    "home decor under 50"
  ];
  
  // Combine provided price filter with default $50 max
  const combinedFilter = {
    max: Math.min(priceFilter?.max || 50, 50), // Never exceed $50 for this category
    min: priceFilter?.min
  };
  
  return searchCategoryBatch(api_key, giftsUnder50Categories, "gifts under $50", page, limit, combinedFilter);
};

// Brand category mappings for multi-category brand searches
const BRAND_CATEGORY_MAPPINGS = {
  apple: [
    "apple macbook laptop computers",
    "apple iphone smartphones",
    "apple ipad tablets", 
    "apple watch smartwatch",
    "apple airpods earbuds headphones",
    "apple mac desktop computers"
  ],
  nike: [
    "nike running shoes",
    "nike athletic clothing apparel",
    "nike basketball shoes",
    "nike workout gear",
    "nike sports accessories"
  ],
  samsung: [
    "samsung galaxy phones",
    "samsung tablets",
    "samsung smartwatch",
    "samsung earbuds",
    "samsung laptops",
    "samsung televisions TVs"
  ],
  sony: [
    "sony headphones",
    "sony cameras", 
    "sony playstation gaming",
    "sony speakers",
    "sony televisions TVs",
    "sony electronics"
  ],
  adidas: [
    "adidas running shoes",
    "adidas athletic clothing",
    "adidas soccer cleats",
    "adidas workout gear",
    "adidas sports accessories"
  ],
  athleisure: [
    "yoga pants leggings",
    "athletic workout tops",
    "sports bras women",
    "activewear shorts",
    "yoga accessories",
    "athletic clothing",
    "workout gear",
    "athleisure wear"
  ],
  madein: [
    "made in cookware pots pans",
    "made in kitchen knives",
    "made in bakeware",
    "made in kitchen accessories",
    "made in carbon steel pans"
  ],
  lego: [
    "lego building sets",
    "lego architecture",
    "lego creator sets",
    "lego technic",
    "lego minifigures"
  ]
};

// Brand categories search handler with brand filtering
const searchBrandCategories = async (api_key: string, brandName: string, page: number = 1, limit: number = 20, priceFilter?: { min?: number; max?: number }) => {
  console.log(`Starting brand category search for: ${brandName}`);
  
  const brandKey = brandName.toLowerCase().replace(/\s+/g, '');
  const categories = BRAND_CATEGORY_MAPPINGS[brandKey as keyof typeof BRAND_CATEGORY_MAPPINGS];
  
  if (!categories) {
    console.log(`No category mapping found for brand: ${brandName}, using fallback search`);
    // Fallback to single brand search
    try {
      const response = await fetch(`https://api.zinc.io/v1/search?query=${encodeURIComponent(brandName)}&page=${page}&retailer=amazon`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
      const data = await response.json();
      
      // Filter results by brand
      let filteredResults = data.results || [];
      if (filteredResults.length > 0) {
        filteredResults = filteredResults.filter((product: any) => {
          const productBrand = (product.brand || '').toLowerCase();
          const targetBrand = brandName.toLowerCase();
          return productBrand.includes(targetBrand) || targetBrand.includes(productBrand);
        });
        console.log(`Filtered fallback search: ${filteredResults.length} products match brand ${brandName}`);
      }
      
      return {
        results: filteredResults,
        total: filteredResults.length
      };
    } catch (error) {
      console.error(`Fallback search failed for ${brandName}:`, error);
      return { results: [], total: 0 };
    }
  }
  
  // Use category batch search and then filter by brand
  const categoryResults = await searchCategoryBatch(api_key, categories, `${brandName} products`, page, limit, priceFilter);
  
  // Filter results to only include products from the specified brand
  if (categoryResults.results && categoryResults.results.length > 0) {
    const filteredResults = categoryResults.results.filter((product: any) => {
      const productBrand = (product.brand || '').toLowerCase().trim();
      const targetBrand = brandName.toLowerCase().trim();
      
      // More flexible brand matching
      const isMatch = productBrand === targetBrand || 
                     productBrand.includes(targetBrand) || 
                     targetBrand.includes(productBrand);
      
      console.log(`Checking product: "${product.title}" | Product brand: "${product.brand}" | Target: "${brandName}" | Match: ${isMatch}`);
      
      return isMatch;
    });
    
    console.log(`Brand filtering complete: ${filteredResults.length} of ${categoryResults.results.length} products match brand "${brandName}"`);
    
    // If no results after filtering, try a fallback search with brand name included
    if (filteredResults.length === 0) {
      console.log(`No products found after filtering, trying fallback search with brand name included`);
      
      try {
        const fallbackCategories = categories.map(cat => `${brandName.toLowerCase()} ${cat}`);
        const fallbackResults = await searchCategoryBatch(api_key, fallbackCategories, `${brandName} fallback`, page, limit, priceFilter);
        
        if (fallbackResults.results && fallbackResults.results.length > 0) {
          const fallbackFiltered = fallbackResults.results.filter((product: any) => {
            const productBrand = (product.brand || '').toLowerCase().trim();
            const targetBrand = brandName.toLowerCase().trim();
            return productBrand === targetBrand || productBrand.includes(targetBrand);
          });
          
          console.log(`Fallback search returned ${fallbackFiltered.length} products for ${brandName}`);
          
          return {
            ...categoryResults,
            results: fallbackFiltered,
            total: fallbackFiltered.length
          };
        }
      } catch (error) {
        console.error(`Fallback search failed:`, error);
      }
    }
    
    return {
      ...categoryResults,
      results: filteredResults,
      total: filteredResults.length
    };
  }
  
  return categoryResults;
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
      console.error('No API key found in database');
      return new Response(JSON.stringify({ 
        error: 'API configuration missing - Zinc API key not found' 
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    const {query, retailer = "amazon", page = 1, limit = 20, luxuryCategories = false, giftsForHer = false, giftsForHim = false, giftsUnder50 = false, brandCategories = false, filters = {}} = await req.json();
    
    // Extract price filters from filters object
    const priceFilter = {
      min: filters.min_price || filters.minPrice,
      max: filters.max_price || filters.maxPrice
    };
    
    console.log('Price filter extracted:', priceFilter);
    
    try {
      // Handle luxury category batch search
      if (luxuryCategories) {
        console.log('Processing luxury category batch request with price filter:', priceFilter);
        const luxuryData = await searchLuxuryCategories(api_key, page, priceFilter);
        
        return new Response(JSON.stringify(luxuryData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for her category batch search
      if (giftsForHer) {
        console.log('Processing gifts for her category batch request with price filter:', priceFilter);
        const giftsForHerData = await searchGiftsForHerCategories(api_key, page, limit, priceFilter);
        
        return new Response(JSON.stringify(giftsForHerData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts for him category batch search
      if (giftsForHim) {
        console.log('Processing gifts for him category batch request with price filter:', priceFilter);
        const giftsForHimData = await searchGiftsForHimCategories(api_key, page, limit, priceFilter);
        
        return new Response(JSON.stringify(giftsForHimData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle gifts under $50 category batch search
      if (giftsUnder50) {
        console.log('Processing gifts under $50 category batch request with price filter:', priceFilter);
        const giftsUnder50Data = await searchGiftsUnder50Categories(api_key, page, limit, priceFilter);
        
        return new Response(JSON.stringify(giftsUnder50Data), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Handle brand categories search
      if (brandCategories && query) {
        console.log(`Processing brand categories request for: ${query} with price filter:`, priceFilter);
        const brandData = await searchBrandCategories(api_key, query, page, limit, priceFilter);
        
        return new Response(JSON.stringify(brandData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Enhanced single search logic with price filtering support
      let searchUrl = `https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=${retailer}`;
      
      // Add price filters to the URL if provided
      if (filters?.min_price) {
        searchUrl += `&min_price=${filters.min_price}`;
      }
      if (filters?.max_price) {
        searchUrl += `&max_price=${filters.max_price}`;
      }
      
      console.log('🎯 Zinc API URL with price filters:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${api_key}:`)
        }
      });
  
      const data = await response.json();
      
      // Apply post-search price filtering if Zinc API didn't handle it properly
      let filteredResults = data.results || [];
      if ((filters?.min_price || filters?.max_price) && filteredResults.length > 0) {
        const minPrice = filters.min_price;
        const maxPrice = filters.max_price;
        
        filteredResults = filteredResults.filter(product => {
          const price = product.price;
          if (!price) return true; // Keep products without price info
          
          const priceInDollars = typeof price === 'number' ? price : parseFloat(price) || 0;
          
          let passesFilter = true;
          if (minPrice && priceInDollars < minPrice) passesFilter = false;
          if (maxPrice && priceInDollars > maxPrice) passesFilter = false;
          
          return passesFilter;
        });
        
        console.log(`🎯 Post-search price filtering: ${data.results.length} → ${filteredResults.length} products (${minPrice ? `$${minPrice}` : 'no min'} to ${maxPrice ? `$${maxPrice}` : 'no max'})`);
      }
      
      // Process best seller data for each product
      if (filteredResults && Array.isArray(filteredResults)) {
        filteredResults = filteredResults.map((product: any) => {
          const bestSellerData = processBestSellerData(product);
          return {
            ...product,
            ...bestSellerData
          };
        });
      }
  
      // Process and normalize prices (Zinc API returns prices in cents)
      if (filteredResults && Array.isArray(filteredResults)) {
        filteredResults = filteredResults.map((product: any) => {
          let normalizedPrice = product.price;
          
          // Convert from cents to dollars if price is in cents
          if (typeof product.price === 'number' && product.price > 100) {
            // If price is over 100 and appears to be in cents, convert to dollars
            normalizedPrice = product.price / 100;
            console.log(`🔄 Price conversion: "${product.title}" - Original: ${product.price} cents → Converted: $${normalizedPrice}`);
          } else if (typeof product.price === 'string') {
            // Handle string prices by parsing and checking if conversion is needed
            const numericPrice = parseFloat(product.price.replace(/[$,]/g, ''));
            if (numericPrice > 100) {
              normalizedPrice = numericPrice / 100;
              console.log(`🔄 Price conversion (string): "${product.title}" - Original: ${product.price} → Converted: $${normalizedPrice}`);
            } else {
              normalizedPrice = numericPrice;
            }
          }
          
          return {
            ...product,
            price: normalizedPrice
          };
        });
      }

      // Log price debugging info for first few products after conversion
      if (filteredResults && filteredResults.length > 0) {
        console.log('🔍 Price debugging after conversion - First 3 products:');
        filteredResults.slice(0, 3).forEach((product: any, index: number) => {
          console.log(`Product ${index + 1}: "${product.title}" - Final Price: $${product.price} (type: ${typeof product.price})`);
        });
      }

      return new Response(JSON.stringify({
        ...data,
        results: filteredResults,
        total: filteredResults.length,
        originalTotal: data.total || 0,
        priceFiltered: (filters?.min_price || filters?.max_price) ? true : false
      }), {
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
