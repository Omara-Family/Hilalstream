import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const episodeId = url.searchParams.get("episode");
    const serverIndex = parseInt(url.searchParams.get("server") || "0");

    if (!episodeId) {
      return new Response(
        JSON.stringify({ error: "Missing episode parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(episodeId)) {
      return new Response(
        JSON.stringify({ error: "Invalid episode ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch episode
    const { data: episode, error } = await supabase
      .from("episodes")
      .select("id, video_servers, series_id")
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return new Response(
        JSON.stringify({ error: "Episode not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const servers = episode.video_servers as { name: string; url: string }[];
    if (!servers || serverIndex < 0 || serverIndex >= servers.length) {
      return new Response(
        JSON.stringify({ error: "Invalid server index" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment views (fire and forget)
    supabase.rpc("increment_episode_views", { _episode_id: episodeId });

    return new Response(
      JSON.stringify({
        url: servers[serverIndex].url,
        server_name: servers[serverIndex].name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
