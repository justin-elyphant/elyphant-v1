import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "images.amazon.com",
  "i.imgur.com",
  "i.ebayimg.com",
]);

// 1x1 transparent PNG
const TRANSPARENT_PNG = Uint8Array.from([
  137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,13,73,68,65,84,8,153,99,0,1,0,0,5,0,1,13,10,38,171,0,0,0,0,73,69,78,68,174,66,96,130
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const urlObj = new URL(req.url);
    const raw = urlObj.searchParams.get("url") || urlObj.searchParams.get("u");
    if (!raw) {
      return new Response(TRANSPARENT_PNG, { status: 200, headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }
    const target = decodeURIComponent(raw);
    let parsed: URL;
    try { parsed = new URL(target); } catch {
      return new Response(TRANSPARENT_PNG, { status: 200, headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }

    if (!ALLOWED_HOSTS.has(parsed.host)) {
      // Basic safety: only proxy known image hosts
      return new Response(TRANSPARENT_PNG, { status: 200, headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }

    const upstream = await fetch(parsed.toString(), {
      // Helpful headers for some CDNs
      headers: {
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; ElyphantEmailImageProxy/1.0)",
      },
    });

    if (!upstream.ok) {
      console.warn("image-proxy upstream error", upstream.status, parsed.toString());
      return new Response(TRANSPARENT_PNG, { status: 200, headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await upstream.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    console.error("image-proxy error", err);
    return new Response(TRANSPARENT_PNG, { status: 200, headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  }
});