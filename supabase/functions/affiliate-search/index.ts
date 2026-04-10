import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  keyword?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  asin?: string;
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  on_sale?: boolean;
  limit?: number;
  page?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AFFILIATE_COM_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AFFILIATE_COM_API_KEY not configured. Add it in your project secrets." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SearchRequest = await req.json();

    // Build the Affiliate.com API request body
    const searchBody: Record<string, unknown> = {};
    if (body.keyword) searchBody.name = body.keyword;
    if (body.brand) searchBody.brand = body.brand;
    if (body.category) searchBody.category = body.category;
    if (body.barcode) searchBody.barcode = body.barcode;
    if (body.asin) searchBody.asin = body.asin;
    if (body.price_min != null) searchBody.price_min = body.price_min;
    if (body.price_max != null) searchBody.price_max = body.price_max;
    if (body.in_stock != null) searchBody.in_stock = body.in_stock;
    if (body.on_sale != null) searchBody.on_sale = body.on_sale;
    searchBody.limit = body.limit ?? 25;
    if (body.page != null) searchBody.page = body.page;

    const API_BASE = Deno.env.get("AFFILIATE_COM_BASE_URL") || "https://api.affiliate.com/v1/products/search";

    // Fetch with 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let apiResponse: Response;
    try {
      apiResponse = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(searchBody),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return new Response(JSON.stringify({ error: "Affiliate.com API timed out. Please try again." }), {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    // Forward rate-limit errors
    if (apiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited by Affiliate.com. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("Affiliate.com API error:", apiResponse.status, errText);
      return new Response(JSON.stringify({
        error: `Affiliate.com API error: ${apiResponse.status}`,
        details: errText,
      }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiData = await apiResponse.json();

    // Normalize response
    const products = (apiData.results || apiData.products || apiData.data || []).map((item: any) => ({
      name: item.name || item.title || "",
      description: item.description || item.long_description || null,
      brand: item.brand || "",
      barcode: item.barcode || item.ean || null,
      asin: item.asin || null,
      sku: item.sku || item.mpn || item.id || "",
      mpn: item.mpn || null,
      regular_price: parseFloat(item.regular_price || item.price || "0"),
      sale_price: item.sale_price || item.final_price ? parseFloat(item.sale_price || item.final_price) : null,
      commission_rate: item.commission_rate || item.commission_percent || null,
      commission_url: item.commission_url || item.affiliate_url || item.tracking_url || "",
      merchant_id: item.merchant_id || item.advertiser_id || "",
      merchant_name: item.merchant_name || item.advertiser_name || "",
      network_name: item.network_name || item.network || "affiliate.com",
      in_stock: item.in_stock ?? item.availability === "in_stock" ?? true,
      on_sale: item.on_sale ?? (item.sale_price != null && item.sale_price !== item.regular_price),
      image_url: item.image_url || item.image || null,
      category: item.category || null,
      currency: item.currency || "USD",
    }));

    return new Response(JSON.stringify({
      products,
      total: apiData.total ?? apiData.total_count ?? products.length,
      page: body.page ?? 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("affiliate-search error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
