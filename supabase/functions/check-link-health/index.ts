import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const KNOWN_AFFILIATE_PARAMS = [
  "tag", "clickid", "click_id", "affiliate_id", "aff_id", "ref",
  "irclickid", "utm_source", "utm_medium", "utm_campaign",
  "subid", "sub_id", "tracking_id", "partner_id",
];

interface RedirectHop {
  url: string;
  status_code: number;
}

async function followRedirects(
  startUrl: string,
  maxHops = 10
): Promise<{ chain: RedirectHop[]; finalUrl: string; ok: boolean }> {
  const chain: RedirectHop[] = [];
  let currentUrl = startUrl;

  for (let i = 0; i < maxHops; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": BROWSER_UA },
      });
      clearTimeout(timeout);

      chain.push({ url: currentUrl, status_code: resp.status });

      if (resp.status >= 300 && resp.status < 400) {
        const location = resp.headers.get("location");
        if (!location) break;
        currentUrl = location.startsWith("http")
          ? location
          : new URL(location, currentUrl).href;
        continue;
      }

      return { chain, finalUrl: currentUrl, ok: resp.status < 400 };
    } catch {
      chain.push({ url: currentUrl, status_code: 0 });
      return { chain, finalUrl: currentUrl, ok: false };
    }
  }

  return { chain, finalUrl: currentUrl, ok: false };
}

function checkParamsIntact(
  originalUrl: string,
  finalUrl: string
): { intact: boolean; missing: string[] } {
  try {
    const origParams = new URL(originalUrl).searchParams;
    const finalParams = new URL(finalUrl).searchParams;
    const missing: string[] = [];

    for (const param of KNOWN_AFFILIATE_PARAMS) {
      const origValue = origParams.get(param);
      if (origValue && !finalParams.has(param)) {
        missing.push(param);
      }
    }

    return { intact: missing.length === 0, missing };
  } catch {
    return { intact: false, missing: ["(URL parse error)"] };
  }
}

interface PageInfo {
  title: string | null;
  productAvailable: boolean | null;
  priceFound: number | null;
  issues: string[];
}

async function scrapePage(url: string): Promise<PageInfo> {
  const info: PageInfo = {
    title: null,
    productAvailable: null,
    priceFound: null,
    issues: [],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      info.issues.push(`Page returned HTTP ${resp.status}`);
      return info;
    }

    const html = await resp.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      info.title = titleMatch[1].trim().substring(0, 500);
    }

    const lowerTitle = (info.title || "").toLowerCase();
    if (
      lowerTitle.includes("404") ||
      lowerTitle.includes("page not found") ||
      lowerTitle.includes("not found")
    ) {
      info.issues.push("Page appears to be a 404");
    }

    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    for (const m of jsonLdMatches) {
      try {
        const ld = JSON.parse(m[1]);
        const product = ld["@type"] === "Product" ? ld : null;
        if (product) {
          const offers = product.offers;
          if (offers) {
            const price = offers.price || offers.lowPrice || offers[0]?.price;
            if (price) info.priceFound = parseFloat(price);

            const avail = offers.availability || offers[0]?.availability || "";
            if (avail.toLowerCase().includes("instock")) {
              info.productAvailable = true;
            } else if (
              avail.toLowerCase().includes("outofstock") ||
              avail.toLowerCase().includes("discontinued")
            ) {
              info.productAvailable = false;
              info.issues.push("Product appears out of stock");
            }
          }
        }
      } catch {
        // invalid JSON-LD, skip
      }
    }

    if (info.priceFound === null) {
      const priceMetaMatch = html.match(
        /meta[^>]*(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]*content=["']([^"']+)["']/i
      );
      if (priceMetaMatch) {
        info.priceFound = parseFloat(priceMetaMatch[1]);
      }
    }

    if (info.productAvailable === null) {
      const lower = html.toLowerCase();
      if (
        lower.includes("out of stock") ||
        lower.includes("currently unavailable") ||
        lower.includes("sold out")
      ) {
        info.productAvailable = false;
        info.issues.push("Product appears out of stock (text match)");
      } else if (
        lower.includes("add to cart") ||
        lower.includes("add to bag") ||
        lower.includes("buy now")
      ) {
        info.productAvailable = true;
      }
    }
  } catch (err) {
    info.issues.push(`Failed to scrape page: ${err.message || "timeout"}`);
  }

  return info;
}

// ── Self-Heal Logic ──────────────────────────────────────────────

function buildUrlFromTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let url = template;
  for (const [key, value] of Object.entries(vars)) {
    url = url.replaceAll(`{{${key}}}`, encodeURIComponent(value));
    url = url.replaceAll(`{${key}}`, encodeURIComponent(value));
  }
  return url;
}

async function tryQuickHead(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": BROWSER_UA },
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

interface RepairResult {
  repaired: boolean;
  newUrl?: string;
  newProductId?: string;
  reason?: string;
}

async function attemptSelfHeal(
  supabaseAdmin: ReturnType<typeof createClient>,
  linkId: string,
  productId: string,
  userId: string,
  oldUrl: string,
  reason: string
): Promise<RepairResult> {
  // 1. Get current product identifiers
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, sku, barcode, mpn, network_id, merchant_id")
    .eq("id", productId)
    .single();

  if (!product) return { repaired: false };

  // 2. Build matching conditions — find same product at different merchant
  let query = supabaseAdmin
    .from("products")
    .select("id, sku, network_id, merchant_id, affiliate_url_template")
    .eq("availability_status", "in_stock")
    .neq("id", product.id);

  // Match by barcode first (strongest match), then sku
  if (product.barcode) {
    query = query.eq("barcode", product.barcode);
  } else if (product.sku) {
    query = query.eq("sku", product.sku);
  } else {
    return { repaired: false }; // No identifiers to match on
  }

  const { data: alternatives } = await query.limit(10);
  if (!alternatives || alternatives.length === 0) return { repaired: false };

  // 3. Try each alternative
  for (const alt of alternatives) {
    if (!alt.network_id) continue;

    // Check user has credentials for this network
    const { data: cred } = await supabaseAdmin
      .from("user_credentials")
      .select("affiliate_id")
      .eq("user_id", userId)
      .eq("network_id", alt.network_id)
      .single();

    if (!cred) continue;

    // Get network template
    const { data: network } = await supabaseAdmin
      .from("networks")
      .select("url_template")
      .eq("id", alt.network_id)
      .single();

    if (!network?.url_template) continue;

    // Build the new URL
    const newUrl = buildUrlFromTemplate(network.url_template, {
      affiliate_id: cred.affiliate_id,
      merchant_id: alt.merchant_id || "",
      sku: alt.sku || "",
      product_url: alt.affiliate_url_template || "",
    });

    if (!newUrl || newUrl.includes("{{") || newUrl.includes("{")) continue;

    // 4. Validate the new URL
    const isValid = await tryQuickHead(newUrl);
    if (!isValid) continue;

    // 5. Update the link silently
    await supabaseAdmin
      .from("affiliate_links")
      .update({
        affiliate_url: newUrl,
        product_id: alt.id,
        health_status: "healthy",
        health_status_code: 200,
      })
      .eq("id", linkId);

    // 6. Log the repair
    await supabaseAdmin.from("link_repairs").insert({
      link_id: linkId,
      old_url: oldUrl,
      new_url: newUrl,
      old_product_id: product.id,
      new_product_id: alt.id,
      reason,
    });

    return { repaired: true, newUrl, newProductId: alt.id, reason };
  }

  return { repaired: false };
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client for RLS reads
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service-role client for self-heal writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Get user's links
    const { data: links, error: linksError } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_url, product_id")
      .eq("user_id", userId);

    if (linksError) throw linksError;
    if (!links || links.length === 0) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const link of links) {
      const issues: string[] = [];

      // Step 1: Follow redirect chain
      const { chain, finalUrl, ok } = await followRedirects(link.affiliate_url);
      if (!ok) issues.push("Redirect chain failed or returned error status");

      // Step 2: Check affiliate params
      const { intact, missing } = checkParamsIntact(link.affiliate_url, finalUrl);
      if (!intact) {
        issues.push(`Tracking parameters lost: ${missing.join(", ")}`);
      }

      // Step 3: Scrape final page
      const pageInfo = await scrapePage(finalUrl);
      issues.push(...pageInfo.issues);

      // Determine overall status
      let overallStatus: "healthy" | "warning" | "broken" = "healthy";
      if (!ok) {
        overallStatus = "broken";
      } else if (!intact || pageInfo.productAvailable === false) {
        overallStatus = "warning";
      }
      if (issues.some((i) => i.includes("404"))) {
        overallStatus = "broken";
      }

      const healthStatus = overallStatus === "warning" ? "healthy" : overallStatus;

      // Store verification
      await supabase.from("link_verifications").insert({
        link_id: link.id,
        redirect_chain: chain,
        final_url: finalUrl,
        params_intact: intact,
        missing_params: missing,
        page_title: pageInfo.title,
        product_available: pageInfo.productAvailable,
        price_found: pageInfo.priceFound,
        overall_status: overallStatus,
        issues,
      });

      // Update affiliate_links health status
      const lastHop = chain[chain.length - 1];
      await supabase
        .from("affiliate_links")
        .update({
          health_status: healthStatus,
          health_status_code: lastHop?.status_code || null,
        })
        .eq("id", link.id);

      // ── Self-Heal: attempt repair for broken/warning links ──
      let repairResult: RepairResult = { repaired: false };
      if (
        (overallStatus === "broken" || overallStatus === "warning") &&
        link.product_id
      ) {
        const reason =
          overallStatus === "broken"
            ? issues.find((i) => i.includes("404")) ? "404" : "broken_redirect"
            : "out_of_stock";

        repairResult = await attemptSelfHeal(
          supabaseAdmin,
          link.id,
          link.product_id,
          userId,
          link.affiliate_url,
          reason
        );
      }

      results.push({
        id: link.id,
        overall_status: overallStatus,
        issues,
        repaired: repairResult.repaired,
        new_url: repairResult.newUrl || null,
      });
    }

    return new Response(JSON.stringify({ checked: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
