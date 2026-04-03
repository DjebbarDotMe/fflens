import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/dist/module/lib/constants.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { productTitle, brandName, shortCode } = await req.json();

    if (!productTitle) {
      return new Response(JSON.stringify({ error: "Missing productTitle" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a marketing copywriter for affiliate products. Generate exactly 3 promotional text variants for the given product. Return a JSON object with keys "twitter", "pinterest", and "email". Each value is a string. Twitter should be under 280 chars. Pinterest should be 2-3 descriptive sentences. Email should be a short promotional paragraph. Include the short link naturally.`;

    const userPrompt = `Product: ${productTitle}\nBrand: ${brandName || "Unknown"}\nShort Link: ${shortCode || "link"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_copy_variants",
              description: "Return 3 promotional copy variants",
              parameters: {
                type: "object",
                properties: {
                  twitter: { type: "string", description: "Twitter/X post under 280 chars" },
                  pinterest: { type: "string", description: "Pinterest description, 2-3 sentences" },
                  email: { type: "string", description: "Short email promotional paragraph" },
                },
                required: ["twitter", "pinterest", "email"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_copy_variants" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let variants;

    if (toolCall?.function?.arguments) {
      variants = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content as JSON
      const content = result.choices?.[0]?.message?.content || "{}";
      variants = JSON.parse(content);
    }

    return new Response(JSON.stringify(variants), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-copy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
