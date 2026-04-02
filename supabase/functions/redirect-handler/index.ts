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

    // Use service role to bypass RLS for click tracking
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_url")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (linkError) throw linkError;
    if (!link) {
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record click
    const ipHash = req.headers.get("x-forwarded-for") || "unknown";
    await supabase.from("link_clicks").insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: req.headers.get("user-agent") || null,
      referrer: req.headers.get("referer") || null,
    });

    // Increment click count
    await supabase.rpc("increment_click_count", { link_id: link.id }).catch(() => {
      // Fallback: just continue with redirect even if increment fails
    });

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: link.affiliate_url },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
