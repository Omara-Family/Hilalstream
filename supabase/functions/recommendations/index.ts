import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get user's favorites
    const { data: favs } = await supabase
      .from("favorites")
      .select("series_id")
      .eq("user_id", user.id);

    // 2. Get user's continue watching
    const { data: watchHistory } = await supabase
      .from("continue_watching")
      .select("episode_id")
      .eq("user_id", user.id);

    // Get series IDs from watched episodes
    let watchedSeriesIds: string[] = [];
    if (watchHistory && watchHistory.length > 0) {
      const epIds = watchHistory.map((w) => w.episode_id);
      const { data: eps } = await supabase
        .from("episodes")
        .select("series_id")
        .in("id", epIds);
      if (eps) watchedSeriesIds = [...new Set(eps.map((e) => e.series_id))];
    }

    const favSeriesIds = favs?.map((f) => f.series_id) || [];
    const interactedIds = [...new Set([...favSeriesIds, ...watchedSeriesIds])];

    if (interactedIds.length === 0) {
      // No history — return popular series
      const { data: popular } = await supabase
        .from("series")
        .select("*")
        .order("total_views", { ascending: false })
        .limit(12);

      return new Response(
        JSON.stringify({ sections: [{ reason: "popular", series: popular || [] }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get interacted series details for genre/tag profiling
    const { data: interactedSeries } = await supabase
      .from("series")
      .select("id, title_ar, title_en, genre, tags, slug")
      .in("id", interactedIds);

    // Build genre/tag frequency profile
    const genreScore: Record<string, number> = {};
    const tagScore: Record<string, number> = {};
    for (const s of interactedSeries || []) {
      for (const g of s.genre || []) genreScore[g] = (genreScore[g] || 0) + 1;
      for (const t of s.tags || []) tagScore[t] = (tagScore[t] || 0) + 1;
    }

    // 4. Get all other series (not already interacted with)
    const { data: allSeries } = await supabase
      .from("series")
      .select("*");

    const candidates = (allSeries || []).filter(
      (s) => !interactedIds.includes(s.id)
    );

    // 5. Score each candidate
    const scored = candidates.map((s) => {
      let score = 0;
      for (const g of s.genre || []) score += (genreScore[g] || 0) * 3;
      for (const t of s.tags || []) score += (tagScore[t] || 0) * 2;
      score += Math.log10((s.total_views || 0) + 1) * 0.5;
      score += (s.rating || 0) * 0.3;
      if (s.is_trending) score += 2;
      return { ...s, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    // 6. Build "Because you watched X" sections
    // Pick up to 3 source series from interacted, find best matches per source
    const sourceSeries = (interactedSeries || []).slice(0, 3);
    const sections: any[] = [];
    const usedIds = new Set<string>();

    for (const source of sourceSeries) {
      const sourceGenres = new Set(source.genre || []);
      const sourceTags = new Set(source.tags || []);

      const matches = scored
        .filter((c) => !usedIds.has(c.id))
        .map((c) => {
          let matchScore = 0;
          for (const g of c.genre || []) if (sourceGenres.has(g)) matchScore += 3;
          for (const t of c.tags || []) if (sourceTags.has(t)) matchScore += 2;
          matchScore += (c._score || 0) * 0.1;
          return { ...c, _matchScore: matchScore };
        })
        .filter((c) => c._matchScore > 0)
        .sort((a, b) => b._matchScore - a._matchScore)
        .slice(0, 8);

      if (matches.length >= 2) {
        sections.push({
          reason: "because_you_watched",
          source_title_ar: source.title_ar,
          source_title_en: source.title_en,
          source_slug: source.slug,
          series: matches.map(({ _score, _matchScore, ...rest }) => rest),
        });
        matches.forEach((m) => usedIds.add(m.id));
      }
    }

    // 7. Add a general "Recommended for you" section with remaining top scored
    const remaining = scored
      .filter((c) => !usedIds.has(c.id))
      .slice(0, 10)
      .map(({ _score, ...rest }) => rest);

    if (remaining.length > 0) {
      sections.push({ reason: "recommended", series: remaining });
    }

    return new Response(JSON.stringify({ sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
