import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { series_id, series_title_en, series_title_ar, series_slug, episode_number, episode_title_en, episode_title_ar, episode_id } = await req.json();

    if (!series_id || !series_slug) {
      throw new Error("series_id and series_slug are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const referenceId = episode_id || series_id;

    // Get users who have this series in favorites AND have favorites_notifications enabled
    const { data: favUsers } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("series_id", series_id);

    const favUserIds = (favUsers || []).map((f: any) => f.user_id);

    // Get profiles with favorites_notifications = true for fav users
    let eligibleUserIds: string[] = [];
    if (favUserIds.length > 0) {
      const { data: eligibleProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("id", favUserIds)
        .eq("favorites_notifications", true);
      eligibleUserIds = (eligibleProfiles || []).map((p: any) => p.id);
    }

    if (eligibleUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No eligible users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check email_logs for deduplication
    const { data: alreadySent } = await supabase
      .from("email_logs")
      .select("user_id")
      .eq("type", "favorite_update")
      .eq("reference_id", referenceId)
      .in("user_id", eligibleUserIds);

    const alreadySentIds = new Set((alreadySent || []).map((l: any) => l.user_id));
    const usersToNotify = eligibleUserIds.filter((id) => !alreadySentIds.has(id));

    if (usersToNotify.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "All already notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth users for emails
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map((authUsers?.users || []).map((u: any) => [u.id, u.email]));

    // Get profile names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", usersToNotify);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

    const emails = usersToNotify
      .filter((id) => authMap.has(id))
      .map((id) => ({
        userId: id,
        email: authMap.get(id)!,
        name: profileMap.get(id) || "Viewer",
      }));

    // Send emails via SMTP
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT") || "465";
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials not configured");
    }

    const nodemailer = await import("npm:nodemailer@6.9.16");
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const siteUrl = "https://hilal-stream.lovable.app";
    const watchUrl = `${siteUrl}/watch/${series_slug}/${episode_number}`;
    const epTitle = episode_title_en || `Episode ${episode_number}`;
    const epTitleAr = episode_title_ar || `الحلقة ${episode_number}`;
    const seriesTitle = series_title_en || "Your favorite series";
    const seriesTitleAr = series_title_ar || "مسلسلك المفضل";

    let sentCount = 0;
    const emailLogs: any[] = [];

    for (const { userId, email, name } of emails) {
      try {
        await transporter.sendMail({
          from: `"HilalStream" <${SMTP_USER}>`,
          to: email,
          subject: `🎬 New Episode: ${seriesTitle} - ${epTitle}`,
          html: buildNewEpisodeEmail(name, seriesTitle, seriesTitleAr, epTitle, epTitleAr, episode_number, watchUrl),
        });
        sentCount++;
        emailLogs.push({
          user_id: userId,
          type: "favorite_update",
          reference_id: referenceId,
        });
      } catch (emailErr) {
        console.error(`Failed to send to ${email}:`, emailErr);
      }
    }

    // Log sent emails for deduplication
    if (emailLogs.length > 0) {
      await supabase.from("email_logs").insert(emailLogs);
    }

    // In-app notifications for fav users
    const notifications = usersToNotify.map((userId: string) => ({
      user_id: userId,
      type: "new_episode",
      title_en: `New Episode Available!`,
      title_ar: `حلقة جديدة متاحة!`,
      message_en: `${seriesTitle} - ${epTitle} is now live!`,
      message_ar: `${seriesTitleAr} - ${epTitleAr} متاحة الآن!`,
      link: `/watch/${series_slug}/${episode_number}`,
    }));

    // Notify admins about the new episode
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = (adminRoles || []).map((r: any) => r.user_id);

    const adminNotifications = adminIds.map((adminId: string) => ({
      user_id: adminId,
      type: "admin_new_episode",
      title_en: `Episode Added`,
      title_ar: `تمت إضافة حلقة`,
      message_en: `${seriesTitle} - ${epTitle} has been added.`,
      message_ar: `${seriesTitleAr} - ${epTitleAr} تمت إضافتها.`,
      link: `/watch/${series_slug}/${episode_number}`,
    }));

    await supabase.from("notifications").insert([...notifications, ...adminNotifications]);

    return new Response(JSON.stringify({ success: true, sent: sentCount, total: emails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notify error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildNewEpisodeEmail(
  name: string, seriesTitle: string, seriesTitleAr: string,
  epTitle: string, epTitleAr: string, epNumber: number, watchUrl: string
) {
  return `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
    <div style="background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#0a0a0a;font-size:22px;font-weight:700;">HilalStream</h1>
      <p style="margin:6px 0 0;color:#1a1a2e;font-size:14px;">🎬 New Episode Alert!</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#f1f1f1;font-size:22px;">Hey ${escapeHtml(name)}!</h2>
      <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Great news! A new episode from one of your favorite series is now available to watch.
      </p>
      <div style="padding:20px;background:#0f0f23;border-radius:14px;border:1px solid #2a2a4a;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#c9a84c;font-size:16px;font-weight:700;">${escapeHtml(seriesTitle)}</p>
        <p style="margin:0 0 4px;color:#9ca3af;font-size:14px;direction:rtl;text-align:right;">${escapeHtml(seriesTitleAr)}</p>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #2a2a4a;">
          <p style="margin:0;color:#e5e5e5;font-size:15px;">📺 Episode ${epNumber}: ${escapeHtml(epTitle)}</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;direction:rtl;text-align:right;">${escapeHtml(epTitleAr)}</p>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${watchUrl}" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
          Watch Now →
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You're receiving this because you added this series to your favorites on HilalStream.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2a2a4a;text-align:center;">
      <p style="margin:0;color:#4b5563;font-size:11px;">© 2025 HilalStream. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
