// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirror of UNIVERSAL_CATEGORIES from src/constants/categories.ts
const SEED_CATEGORIES = [
  { value: "electronics", searchTerm: "best selling electronics apple samsung sony bose lg hp dell canon nikon fitbit garmin" },
  { value: "flowers", searchTerm: "fresh flowers bouquet delivery roses tulips sunflowers orchids wedding flowers sympathy arrangements seasonal blooms" },
  { value: "fashion", searchTerm: "best selling fashion clothing apparel shoes accessories" },
  { value: "pets", searchTerm: "best selling pet products dog cat supplies toys treats" },
  { value: "home", searchTerm: "home decor furniture kitchen accessories bedding curtains pillows candles" },
  { value: "beauty", searchTerm: "skincare makeup cosmetics beauty products lipstick foundation moisturizer" },
  { value: "sports", searchTerm: "best selling sports equipment nike adidas under armour wilson spalding yeti coleman outdoor gear fitness" },
  { value: "athleisure", searchTerm: "athletic wear yoga pants leggings activewear nike adidas lululemon under armour alo yoga" },
  { value: "books", searchTerm: "best selling books fiction nonfiction thriller romance mystery science biography" },
  { value: "toys", searchTerm: "toys games kids children educational puzzles building blocks dolls action figures" },
  { value: "arts", searchTerm: "art supplies craft supplies drawing materials paint brushes canvas markers colored pencils craft kits" },
  { value: "health", searchTerm: "best selling health wellness vitamins supplements fitness tracker massage" },
  { value: "baby", searchTerm: "best selling baby products stroller crib diaper monitor" },
  { value: "jewelry", searchTerm: "best selling jewelry necklace bracelet earrings rings gold silver diamond" },
  { value: "kitchen", searchTerm: "best selling kitchen products cookware knives blender coffee maker air fryer instant pot" },
  { value: "tech", searchTerm: "best selling tech products smart devices gadgets phone accessories chargers cables" },
  { value: "music", searchTerm: "musical instruments headphones speakers vinyl records turntables guitar keyboard piano" },
  { value: "gaming", searchTerm: "gaming console accessories controllers headsets keyboards mice playstation xbox nintendo" },
  { value: "wedding", searchTerm: "wedding gifts bridal party engagement reception decorations invitations favors registry" },
  { value: "best-selling", searchTerm: "best selling top rated popular trending most bought bestseller" },
  { value: "gifts", searchTerm: "best selling gifts birthday christmas holiday gift sets gift baskets gift cards" },
  { value: "bags-purses", searchTerm: "best selling bags purses handbags tote crossbody backpacks designer bags wallets" },
  // Wedding subcollections
  { value: "wedding gifts for couple", searchTerm: "wedding gifts for couple" },
  { value: "bridal party gifts", searchTerm: "bridal party gifts" },
  { value: "wedding registry gifts", searchTerm: "wedding registry gifts" },
  { value: "wedding decorations", searchTerm: "wedding decorations" },
  { value: "honeymoon essentials", searchTerm: "honeymoon essentials" },
  // Baby subcollections
  { value: "baby essentials", searchTerm: "baby essentials" },
  { value: "diapers and wipes", searchTerm: "diapers and wipes" },
  { value: "top baby products", searchTerm: "top baby products" },
  { value: "nursery decor", searchTerm: "nursery decor" },
  { value: "baby clothing", searchTerm: "baby clothing" },
];

const calculatePopularityScore = (product: any) => {
  let score = 20;
  const stars = product.stars || product.rating || 0;
  const reviewCount = product.review_count || product.num_reviews || 0;

  if (stars > 0 && reviewCount > 0) score += 50;
  else if (reviewCount > 0) score += 30;
  else if (stars > 0) score += 25;

  if (stars >= 4) score += (stars - 3) * 25;
  if (reviewCount > 0) score += Math.min(25, Math.log10(reviewCount + 1) * 10);

  const badge = (product.bestSellerType || product.badge_text || '').toLowerCase();
  if (badge.includes("amazon's choice") || badge.includes("amazons choice")) score += 60;
  else if (badge.includes("best seller")) score += 50;
  else if (badge.includes("top rated")) score += 40;

  return score;
};

const searchZinc = async (apiKey: string, query: string, page: number) => {
  const url = `https://api.zinc.io/v1/search?query=${encodeURIComponent(query)}&page=${page}&retailer=amazon`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': 'Basic ' + btoa(`${apiKey}:`) }
  });
  if (!resp.ok) {
    console.error(`Zinc search failed for "${query}" page ${page}: ${resp.status}`);
    return [];
  }
  const data = await resp.json();
  return data.results || [];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zincApiKey = Deno.env.get('ZINC_API_KEY');
    
    if (!zincApiKey) {
      return new Response(JSON.stringify({ error: 'ZINC_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const targetPerCategory = body.target_per_category || 40;
    const requestedCategories: string[] | undefined = body.categories;
    const dryRun = body.dry_run || false;

    const categoriesToSeed = requestedCategories
      ? SEED_CATEGORIES.filter(c => requestedCategories.includes(c.value))
      : SEED_CATEGORIES;

    const report: any[] = [];
    let totalApiCalls = 0;
    let totalProductsAdded = 0;
    const startTime = Date.now();

    for (const cat of categoriesToSeed) {
      // Count existing products matching this frontend category
      // Use search_terms ILIKE for reliable matching (all seeded products have category in search_terms)
      const { count: existingCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .ilike('search_terms', `%${cat.value}%`);

      const current = existingCount || 0;
      const deficit = Math.max(0, targetPerCategory - current);

      if (deficit === 0) {
        report.push({ category: cat.value, existing: current, added: 0, status: 'already_stocked' });
        console.log(`✅ ${cat.value}: already has ${current} products, skipping`);
        continue;
      }

      if (dryRun) {
        const pagesNeeded = Math.min(Math.ceil(deficit / 20), 3);
        report.push({
          category: cat.value, existing: current, deficit,
          pages_needed: pagesNeeded,
          estimated_cost: `$${(pagesNeeded * 0.01).toFixed(2)}`,
          status: 'dry_run'
        });
        totalApiCalls += pagesNeeded;
        continue;
      }

      // Fetch pages until we have enough (cap at 3 pages = ~60 products)
      const pagesNeeded = Math.min(Math.ceil(deficit / 20), 3);
      const allResults: any[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const results = await searchZinc(zincApiKey, cat.searchTerm, page);
        allResults.push(...results);
        totalApiCalls++;
        if (page < pagesNeeded) await new Promise(r => setTimeout(r, 300));
      }

      // Deduplicate by product_id
      const seen = new Set<string>();
      const uniqueProducts = allResults.filter(p => {
        const id = p.product_id || p.asin;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      // Map to DB format
      const productsToUpsert = uniqueProducts.map(p => {
        let price = typeof p.price === 'number' ? p.price : parseFloat(String(p.price).replace(/[$,]/g, '')) || 0;
        if (price > 200) price = price / 100;

        const metadata = {
          stars: p.stars || p.rating || null,
          review_count: p.review_count || p.num_reviews || null,
          num_sales: p.num_sales || null,
          main_image: p.main_image || p.image,
          images: p.images || [p.main_image || p.image].filter(Boolean),
          isBestSeller: p.isBestSeller || false,
          bestSellerType: p.bestSellerType || null,
          badgeText: p.badgeText || null,
          source: 'seed_catalog',
          source_query: cat.searchTerm,
          seeded_category: cat.value,
          cached_at: new Date().toISOString()
        };

        return {
          product_id: p.product_id || p.asin,
          title: p.title,
          price,
          image_url: p.main_image || p.image || p.thumbnail,
          retailer: 'amazon',
          brand: p.brand || null,
          category: p.category || p.categories?.[0] || null,
          search_terms: cat.value,
          last_refreshed_at: new Date().toISOString(),
          popularity_score: calculatePopularityScore(p),
          metadata
        };
      }).filter(p => p.product_id && p.price > 0);

      if (productsToUpsert.length > 0) {
        for (let i = 0; i < productsToUpsert.length; i += 50) {
          const batch = productsToUpsert.slice(i, i + 50);
          const { error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'product_id', ignoreDuplicates: false });
          if (error) {
            console.error(`❌ Upsert error for ${cat.value}:`, error.message);
          }
        }
      }

      totalProductsAdded += productsToUpsert.length;
      report.push({
        category: cat.value, existing: current,
        fetched: allResults.length, added: productsToUpsert.length,
        status: 'seeded'
      });
      console.log(`✅ ${cat.value}: +${productsToUpsert.length} products (was ${current})`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const summary = {
      success: true,
      total_categories: categoriesToSeed.length,
      total_api_calls: totalApiCalls,
      total_products_added: totalProductsAdded,
      estimated_cost: `$${(totalApiCalls * 0.01).toFixed(2)}`,
      duration_seconds: duration,
      dry_run: dryRun,
      report
    };

    console.log(`🎯 Seeding complete: ${totalProductsAdded} products, ${totalApiCalls} API calls ($${(totalApiCalls * 0.01).toFixed(2)}) in ${duration}s`);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Seed function error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
