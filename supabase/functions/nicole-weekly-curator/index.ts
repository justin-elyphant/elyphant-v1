import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZINC_API_KEY = Deno.env.get("ZINC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cost control: refresh threshold (products must have 10+ searches in 7 days)
const MIN_SEARCH_COUNT_THRESHOLD = 10;
const LOOKBACK_DAYS = 7;
const MAX_PRODUCTS_PER_RUN = 100; // Limit to control costs (~$1/run)
const ZINC_COST_PER_SEARCH = 0.01;

interface SearchTrend {
  id: string;
  search_query: string;
  search_count: number;
  last_searched_at: string;
}

interface ZincProduct {
  product_id: string;
  title: string;
  price: number;
  image: string;
  stars?: number;
  num_reviews?: number;
  brand?: string;
  category?: string;
  num_sales?: number;
  [key: string]: any;
}

serve(async (req) => {
  console.log("🤖 Nicole Weekly Curator starting...");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();
  const stats = {
    trendingQueries: 0,
    productsRefreshed: 0,
    productsSkipped: 0,
    errors: 0,
    estimatedCost: 0,
  };

  try {
    // Step 1: Find trending queries (10+ searches in last 7 days)
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - LOOKBACK_DAYS);

    const { data: trendingQueries, error: trendsError } = await supabase
      .from("search_trends")
      .select("id, search_query, search_count, last_searched_at")
      .gte("search_count", MIN_SEARCH_COUNT_THRESHOLD)
      .gte("last_searched_at", lookbackDate.toISOString())
      .order("search_count", { ascending: false })
      .limit(MAX_PRODUCTS_PER_RUN);

    if (trendsError) {
      console.error("Error fetching trending queries:", trendsError);
      throw trendsError;
    }

    stats.trendingQueries = trendingQueries?.length || 0;
    console.log(`📊 Found ${stats.trendingQueries} trending queries above threshold`);

    if (!trendingQueries || trendingQueries.length === 0) {
      console.log("✅ No trending queries need refresh. Nicole is resting.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No trending queries need refresh",
          stats,
          duration_ms: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: For each trending query, refresh products from Zinc
    for (const trend of trendingQueries) {
      try {
        console.log(`🔄 Refreshing products for: "${trend.search_query}" (${trend.search_count} searches)`);

        // Check if we already have cached products for this query
        const { data: existingProducts } = await supabase
          .from("products")
          .select("product_id, updated_at")
          .eq("source_query", trend.search_query.toLowerCase())
          .order("updated_at", { ascending: false })
          .limit(1);

        // Skip if products were updated recently (within 24 hours)
        if (existingProducts && existingProducts.length > 0) {
          const lastUpdate = new Date(existingProducts[0].updated_at);
          const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate < 24) {
            console.log(`⏭️ Skipping "${trend.search_query}" - updated ${Math.round(hoursSinceUpdate)}h ago`);
            stats.productsSkipped++;
            continue;
          }
        }

        // Fetch fresh products from Zinc API
        if (!ZINC_API_KEY) {
          console.error("ZINC_API_KEY not configured");
          stats.errors++;
          continue;
        }

        const zincResponse = await fetch(
          `https://api.zinc.io/v1/search?query=${encodeURIComponent(trend.search_query)}&retailer=amazon`,
          {
            headers: {
              Authorization: `Basic ${btoa(`${ZINC_API_KEY}:`)}`,
            },
          }
        );

        if (!zincResponse.ok) {
          console.error(`Zinc API error for "${trend.search_query}":`, zincResponse.status);
          stats.errors++;
          continue;
        }

        const zincData = await zincResponse.json();
        const products: ZincProduct[] = zincData.results || [];
        stats.estimatedCost += ZINC_COST_PER_SEARCH;

        if (products.length === 0) {
          console.log(`📭 No products returned for "${trend.search_query}"`);
          continue;
        }

        // Step 3: Upsert products into cache
        const productInserts = products.slice(0, 20).map((product) => ({
          product_id: product.product_id,
          title: product.title,
          price: product.price,
          image: product.image,
          stars: product.stars || null,
          review_count: product.num_reviews || null,
          brand: product.brand || null,
          category: product.category || null,
          retailer: "amazon",
          source_query: trend.search_query.toLowerCase(),
          metadata: {
            num_sales: product.num_sales,
            stars: product.stars,
            review_count: product.num_reviews,
            ...product,
          },
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from("products")
          .upsert(productInserts, { onConflict: "product_id" });

        if (upsertError) {
          console.error(`Error caching products for "${trend.search_query}":`, upsertError);
          stats.errors++;
        } else {
          stats.productsRefreshed += productInserts.length;
          console.log(`✅ Cached ${productInserts.length} products for "${trend.search_query}"`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (queryError) {
        console.error(`Error processing query "${trend.search_query}":`, queryError);
        stats.errors++;
      }
    }

    // Log execution summary
    const duration = Date.now() - startTime;
    console.log("🎉 Nicole Weekly Curator complete!");
    console.log(`   - Trending queries processed: ${stats.trendingQueries}`);
    console.log(`   - Products refreshed: ${stats.productsRefreshed}`);
    console.log(`   - Products skipped (recent): ${stats.productsSkipped}`);
    console.log(`   - Errors: ${stats.errors}`);
    console.log(`   - Estimated cost: $${stats.estimatedCost.toFixed(2)}`);
    console.log(`   - Duration: ${duration}ms`);

    // Log to cron_execution_logs for monitoring
    await supabase.from("cron_execution_logs").insert({
      cron_job_name: "nicole-weekly-curator",
      status: stats.errors === 0 ? "success" : "partial_success",
      execution_started_at: new Date(startTime).toISOString(),
      execution_completed_at: new Date().toISOString(),
      success_count: stats.productsRefreshed,
      failure_count: stats.errors,
      execution_metadata: {
        trending_queries: stats.trendingQueries,
        products_refreshed: stats.productsRefreshed,
        products_skipped: stats.productsSkipped,
        estimated_cost: stats.estimatedCost,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Nicole Weekly Curator error:", error);

    // Log failure
    await supabase.from("cron_execution_logs").insert({
      cron_job_name: "nicole-weekly-curator",
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      execution_started_at: new Date(startTime).toISOString(),
      execution_completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stats,
        duration_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
