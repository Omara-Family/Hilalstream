import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather analytics data
    const [seriesRes, episodesRes, continueRes, favoritesRes, profilesRes] = await Promise.all([
      supabase.from("series").select("id, title_en, title_ar, genre, tags, total_views, rating, is_trending, created_at"),
      supabase.from("episodes").select("id, series_id, episode_number, views, created_at"),
      supabase.from("continue_watching").select("id, episode_id, progress_seconds, updated_at, user_id"),
      supabase.from("favorites").select("id, series_id, user_id, created_at"),
      supabase.from("profiles").select("id, created_at"),
    ]);

    const series = seriesRes.data || [];
    const episodes = episodesRes.data || [];
    const continueWatching = continueRes.data || [];
    const favorites = favoritesRes.data || [];
    const profiles = profilesRes.data || [];

    // 1. Genre distribution (views per genre)
    const genreViews: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    for (const s of series) {
      for (const g of (s.genre || [])) {
        genreViews[g] = (genreViews[g] || 0) + (s.total_views || 0);
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
    const genreData = Object.entries(genreViews)
      .map(([genre, views]) => ({ genre, views, count: genreCounts[genre] || 0 }))
      .sort((a, b) => b.views - a.views);

    // 2. Top series by views
    const topSeries = [...series]
      .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
      .slice(0, 10)
      .map((s) => ({ name: s.title_en || s.title_ar, views: s.total_views || 0, rating: s.rating || 0 }));

    // 3. Series added over time (monthly)
    const monthlyAdded: Record<string, number> = {};
    for (const s of series) {
      const month = s.created_at?.substring(0, 7);
      if (month) monthlyAdded[month] = (monthlyAdded[month] || 0) + 1;
    }
    const growthData = Object.entries(monthlyAdded)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // 4. Abandonment analysis (users who started but have low progress)
    const seriesIdMap: Record<string, string> = {};
    for (const ep of episodes) {
      seriesIdMap[ep.id] = ep.series_id;
    }
    const abandonmentBySeries: Record<string, { started: number; low: number }> = {};
    for (const cw of continueWatching) {
      const sid = seriesIdMap[cw.episode_id];
      if (!sid) continue;
      if (!abandonmentBySeries[sid]) abandonmentBySeries[sid] = { started: 0, low: 0 };
      abandonmentBySeries[sid].started++;
      if ((cw.progress_seconds || 0) < 300) abandonmentBySeries[sid].low++;
    }
    const abandonmentData = Object.entries(abandonmentBySeries)
      .map(([sid, d]) => {
        const s = series.find((x) => x.id === sid);
        return { name: s?.title_en || sid.substring(0, 8), started: d.started, abandoned: d.low, rate: d.started > 0 ? Math.round((d.low / d.started) * 100) : 0 };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);

    // 5. Favorites distribution
    const favBySeries: Record<string, number> = {};
    for (const f of favorites) {
      favBySeries[f.series_id] = (favBySeries[f.series_id] || 0) + 1;
    }
    const favData = Object.entries(favBySeries)
      .map(([sid, count]) => {
        const s = series.find((x) => x.id === sid);
        return { name: s?.title_en || sid.substring(0, 8), favorites: count };
      })
      .sort((a, b) => b.favorites - a.favorites)
      .slice(0, 10);

    // 6. User growth over time
    const monthlyUsers: Record<string, number> = {};
    for (const p of profiles) {
      const month = p.created_at?.substring(0, 7);
      if (month) monthlyUsers[month] = (monthlyUsers[month] || 0) + 1;
    }
    const userGrowthData = Object.entries(monthlyUsers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Build context for AI insights
    const analyticsContext = {
      totalSeries: series.length,
      totalEpisodes: episodes.length,
      totalUsers: profiles.length,
      totalViews: series.reduce((s, r) => s + (r.total_views || 0), 0),
      topGenres: genreData.slice(0, 5),
      topSeries: topSeries.slice(0, 5),
      abandonmentData: abandonmentData.slice(0, 5),
      favData: favData.slice(0, 5),
      recentSeriesCount: series.filter((s) => {
        const d = new Date(s.created_at);
        return d > new Date(Date.now() - 30 * 86400000);
      }).length,
    };

    // Generate AI insights
    const aiApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights = "";

    if (aiApiKey) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "You are an analytics advisor for a streaming platform. Provide 4-6 concise, actionable insights based on the data. Format each insight as a bullet point starting with an emoji. Keep it under 300 words total. Write in English.",
            },
            {
              role: "user",
              content: `Analyze this platform data and provide strategic insights:\n${JSON.stringify(analyticsContext, null, 2)}`,
            },
          ],
          max_tokens: 500,
        }),
      });
      const aiData = await aiRes.json();
      aiInsights = aiData.choices?.[0]?.message?.content || "Unable to generate insights at this time.";
    }

    return new Response(
      JSON.stringify({
        genreData,
        topSeries,
        growthData,
        abandonmentData,
        favData,
        userGrowthData,
        aiInsights,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
