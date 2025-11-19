import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ NIKE-ONLY TEST MODE - Full seed commented out for testing
// const CATEGORIES = [
//   "electronics", "flowers", "fashion", "pets", "home", "beauty", 
//   "sports", "athleisure", "books", "toys", "food", "arts", 
//   "health", "baby", "jewelry", "kitchen", "tech", "music", 
//   "gaming", "wedding", "best-selling", "gifts", "bags-purses", "outdoor"
// ];

const CATEGORIES: string[] = []; // Skip categories for Nike test

// Nike-only test (6 searches × $0.01 = $0.06 for ~600 products)
const BRANDS = ["nike"];

// Nike-only related products
const BRAND_RELATIONS: Record<string, string[]> = {
  "nike": ["nike socks", "nike bag", "nike water bottle", "nike headband", "nike shorts"]
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ZINC_API_KEY = Deno.env.get("ZINC_API_KEY");
    if (!ZINC_API_KEY) {
      throw new Error("ZINC_API_KEY not configured");
    }

    const seedResults = {
      categories: {} as Record<string, number>,
      brands: {} as Record<string, number>,
      brandRelated: {} as Record<string, number>,
      totalProducts: 0,
      totalCost: 0,
      duration: 0
    };

    const startTime = Date.now();

    // Helper function to fetch from Zinc and preserve REAL review data
    const fetchAndStoreProducts = async (query: string, metadata: { type: string; value: string }) => {
      console.log(`🔍 Fetching: "${query}"`);
      
      try {
        const response = await fetch("https://api.zinc.io/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(ZINC_API_KEY + ":")}`
          },
          body: JSON.stringify({
            query: query,
            max_results: 100,
            retailer: "amazon"
          })
        });

        if (!response.ok) {
          console.error(`❌ Zinc API error for "${query}": ${response.status}`);
          return 0;
        }

        const data = await response.json();
        const results = data.results || [];

        if (results.length === 0) {
          console.warn(`⚠️ No results for "${query}"`);
          return 0;
        }

        // CRITICAL: Preserve REAL review data from Zinc
        const productsToInsert = results.map((p: any) => ({
          product_id: p.product_id,
          title: p.title,
          description: p.product_description || p.title,
          price: p.price,
          image_url: p.main_image || p.image,
          
          // ✅ REAL Amazon review data from Zinc API
          stars: p.stars || null,
          review_count: p.review_count || null,
          num_reviews: p.review_count || null,
          question_count: p.question_count || null,
          
          brand: p.brand || metadata.value,
          category: metadata.type === 'category' ? metadata.value : p.categories?.[0],
          feature_bullets: p.feature_bullets || [],
          
          freshness_score: 100,
          last_synced_at: new Date().toISOString()
        }));

        // Upsert to avoid duplicates
        const { error } = await supabase
          .from('products')
          .upsert(productsToInsert, { 
            onConflict: 'product_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`❌ Database error for "${query}":`, error.message);
          return 0;
        }

        console.log(`✅ Cached ${results.length} products for "${query}" with REAL review data`);
        return results.length;
      } catch (error) {
        console.error(`❌ Error processing "${query}":`, error);
        return 0;
      }
    };

    // 1. Seed categories (SKIPPED FOR NIKE TEST)
    console.log("📦 Phase 1: Skipping categories for Nike-only test...");
    if (CATEGORIES.length > 0) {
      for (const category of CATEGORIES) {
        const query = `best selling ${category}`;
        const count = await fetchAndStoreProducts(query, { type: 'category', value: category });
        seedResults.categories[category] = count;
        seedResults.totalProducts += count;
        seedResults.totalCost += 0.01;
      }
    }

    // 2. Seed brands (20 brands × 100 products = 2,000 products, $0.20)
    console.log("🏷️ Phase 2: Seeding brands...");
    for (const brand of BRANDS) {
      const query = `best selling ${brand}`;
      const count = await fetchAndStoreProducts(query, { type: 'brand', value: brand });
      seedResults.brands[brand] = count;
      seedResults.totalProducts += count;
      seedResults.totalCost += 0.01;
    }

    // 3. Seed brand-specific related products (20 brands × 5 related = 100 queries × 100 products = 10,000 products, $1.00)
    console.log("🔗 Phase 3: Seeding related products for brands...");
    for (const [brand, relatedQueries] of Object.entries(BRAND_RELATIONS)) {
      for (const relatedQuery of relatedQueries) {
        const count = await fetchAndStoreProducts(relatedQuery, { type: 'related', value: brand });
        seedResults.brandRelated[relatedQuery] = count;
        seedResults.totalProducts += count;
        seedResults.totalCost += 0.01;
      }
    }

    seedResults.duration = Math.round((Date.now() - startTime) / 1000);

    console.log("🎉 Seed complete!");
    console.log(`Total products: ${seedResults.totalProducts}`);
    console.log(`Total cost: $${seedResults.totalCost.toFixed(2)}`);
    console.log(`Duration: ${seedResults.duration}s`);

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Seeded ${seedResults.totalProducts} products with REAL Amazon review data for $${seedResults.totalCost.toFixed(2)}`,
      details: {
        ...seedResults,
        breakdown: {
          categories: `${CATEGORIES.length} categories → ${Object.values(seedResults.categories).reduce((a, b) => a + b, 0)} products ($${(CATEGORIES.length * 0.01).toFixed(2)})`,
          brands: `${BRANDS.length} brands → ${Object.values(seedResults.brands).reduce((a, b) => a + b, 0)} products ($${(BRANDS.length * 0.01).toFixed(2)})`,
          related: `${Object.keys(BRAND_RELATIONS).reduce((acc, key) => acc + BRAND_RELATIONS[key].length, 0)} related queries → ${Object.values(seedResults.brandRelated).reduce((a, b) => a + b, 0)} products ($${(Object.keys(BRAND_RELATIONS).reduce((acc, key) => acc + BRAND_RELATIONS[key].length, 0) * 0.01).toFixed(2)})`
        }
      }
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("❌ Seed error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
