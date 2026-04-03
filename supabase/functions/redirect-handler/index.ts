import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.searchParams.get("code");

    if (!shortCode) {
      return new Response(JSON.stringify({ error: "Missing 'code' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_url, geo_rules, ab_test_urls")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link) {
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let destinationUrl = link.affiliate_url;
    let countryCode: string | null = null;

    // A/B Testing: if ab_test_urls has entries, randomly split traffic
    if (link.ab_test_urls && Array.isArray(link.ab_test_urls) && link.ab_test_urls.length > 0) {
      const allUrls = [link.affiliate_url, ...link.ab_test_urls];
      destinationUrl = allUrls[Math.floor(Math.random() * allUrls.length)];
    } else {
      // Geo-routing: best-effort via cf-ipcountry header
      countryCode = req.headers.get("cf-ipcountry") || req.headers.get("x-country-code") || null;

      if (countryCode && link.geo_rules && typeof link.geo_rules === "object") {
        const geoRules = link.geo_rules as Record<string, string>;
        const upperCode = countryCode.toUpperCase();
        if (geoRules[upperCode]) {
          destinationUrl = geoRules[upperCode];
        }
      }
    }

    // Record click with tracking data
    const ipHash = req.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("link_clicks").insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: req.headers.get("user-agent") || null,
      referrer: req.headers.get("referer") || null,
      country_code: countryCode,
      served_url: destinationUrl,
    });

    // Increment click count
    await supabase.rpc("increment_click_count", { link_id: link.id }).catch(() => {});

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: destinationUrl },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
