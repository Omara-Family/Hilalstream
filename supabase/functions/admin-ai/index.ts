import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TaskType = "seo" | "improve_description" | "social_caption" | "suggest_tags";

const buildPrompt = (task: TaskType, context: Record<string, string>): string => {
  const { title_en, title_ar, description_en, description_ar, genre, tags } = context;
  const base = `Series: "${title_en}" / "${title_ar}"\nGenres: ${genre}\nTags: ${tags}\nDescription EN: ${description_en}\nDescription AR: ${description_ar}`;

  switch (task) {
    case "seo":
      return `${base}\n\nGenerate SEO metadata for this series. Return a JSON object with:\n- "meta_title_en" (max 60 chars)\n- "meta_title_ar" (max 60 chars)\n- "meta_description_en" (max 160 chars)\n- "meta_description_ar" (max 160 chars)\n- "keywords" (array of 5-10 keywords)\n\nReturn ONLY the JSON object, no markdown.`;

    case "improve_description":
      return `${base}\n\nImprove both the English and Arabic descriptions for this series. Make them more engaging, compelling, and SEO-friendly while keeping the original meaning. Each should be 2-3 sentences.\n\nReturn a JSON object with:\n- "description_en"\n- "description_ar"\n\nReturn ONLY the JSON object, no markdown.`;

    case "social_caption":
      return `${base}\n\nCreate social media captions for promoting this series. Generate engaging captions with emojis and hashtags.\n\nReturn a JSON object with:\n- "twitter_en" (max 280 chars)\n- "twitter_ar" (max 280 chars)\n- "instagram_en" (longer, with hashtags)\n- "instagram_ar" (longer, with hashtags)\n\nReturn ONLY the JSON object, no markdown.`;

    case "suggest_tags":
      return `${base}\n\nSuggest relevant tags for this series based on its content, genre, and themes. Include both broad and specific tags.\n\nReturn a JSON object with:\n- "tags" (array of 8-15 lowercase English tags)\n\nReturn ONLY the JSON object, no markdown.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify admin role via auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task, context } = await req.json() as { task: TaskType; context: Record<string, string> };
    const prompt = buildPrompt(task, context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a content assistant for a streaming platform specializing in Turkish/Arabic drama series. You are bilingual in English and Arabic. Always return valid JSON only, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (strip markdown fences if present)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
