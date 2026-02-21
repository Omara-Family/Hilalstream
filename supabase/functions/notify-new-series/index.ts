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
    const { series_id, series_title_en, series_title_ar, series_slug, poster_image } = await req.json();

    if (!series_id || !series_slug) {
      throw new Error("series_id and series_slug are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get users with newsletter_opt_in = true
    const { data: optedInProfiles } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("newsletter_opt_in", true);

    const eligibleUsers = optedInProfiles || [];
    if (eligibleUsers.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No opted-in users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eligibleUserIds = eligibleUsers.map((p: any) => p.id);

    // Deduplication check
    const { data: alreadySent } = await supabase
      .from("email_logs")
      .select("user_id")
      .eq("type", "newsletter")
      .eq("reference_id", series_id)
      .in("user_id", eligibleUserIds);

    const alreadySentIds = new Set((alreadySent || []).map((l: any) => l.user_id));
    const usersToNotify = eligibleUsers.filter((u: any) => !alreadySentIds.has(u.id));

    if (usersToNotify.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "All already notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth emails
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map((authUsers?.users || []).map((u: any) => [u.id, u.email]));

    const emails = usersToNotify
      .filter((u: any) => authMap.has(u.id))
      .map((u: any) => ({
        userId: u.id,
        email: authMap.get(u.id)!,
        name: u.name || "Viewer",
      }));

    // SMTP setup
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
    const seriesUrl = `${siteUrl}/series/${series_slug}`;
    const seriesTitle = series_title_en || "New Series";
    const seriesTitleAr = series_title_ar || "مسلسل جديد";

    let sentCount = 0;
    const emailLogs: any[] = [];

    for (const { userId, email, name } of emails) {
      try {
        await transporter.sendMail({
          from: `"HilalStream" <${SMTP_USER}>`,
          to: email,
          subject: `🌟 New Series: ${seriesTitle} - Now on HilalStream!`,
          html: buildNewSeriesEmail(name, seriesTitle, seriesTitleAr, seriesUrl, poster_image),
        });
        sentCount++;
        emailLogs.push({
          user_id: userId,
          type: "newsletter",
          reference_id: series_id,
        });
      } catch (emailErr) {
        console.error(`Failed to send to ${email}:`, emailErr);
      }
    }

    // Log sent emails
    if (emailLogs.length > 0) {
      await supabase.from("email_logs").insert(emailLogs);
    }

    // In-app notifications for opted-in users
    const notifications = usersToNotify.map((u: any) => ({
      user_id: u.id,
      type: "new_series",
      title_en: `New Series Added!`,
      title_ar: `مسلسل جديد!`,
      message_en: `${seriesTitle} is now available on HilalStream!`,
      message_ar: `${seriesTitleAr} متاح الآن على HilalStream!`,
      link: `/series/${series_slug}`,
    }));

    // Notify admins about the new series
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = (adminRoles || []).map((r: any) => r.user_id);

    const adminNotifications = adminIds.map((adminId: string) => ({
      user_id: adminId,
      type: "admin_new_series",
      title_en: `New Series Added`,
      title_ar: `تم إضافة مسلسل جديد`,
      message_en: `${seriesTitle} has been added to HilalStream.`,
      message_ar: `${seriesTitleAr} تم إضافته إلى HilalStream.`,
      link: `/series/${series_slug}`,
    }));

    await supabase.from("notifications").insert([...notifications, ...adminNotifications]);

    return new Response(JSON.stringify({ success: true, sent: sentCount, total: emails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notify new series error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildNewSeriesEmail(
  name: string, seriesTitle: string, seriesTitleAr: string,
  seriesUrl: string, posterImage?: string
) {
  const posterBlock = posterImage
    ? `<img src="${escapeHtml(posterImage)}" alt="${escapeHtml(seriesTitle)}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:20px;" />`
    : '';

  return `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
    <div style="background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#0a0a0a;font-size:22px;font-weight:700;">HilalStream</h1>
      <p style="margin:6px 0 0;color:#1a1a2e;font-size:14px;">🌟 New Series Alert!</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#f1f1f1;font-size:22px;">Hey ${escapeHtml(name)}!</h2>
      <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We just added a brand new series to our collection. Check it out!
      </p>
      ${posterBlock}
      <div style="padding:20px;background:#0f0f23;border-radius:14px;border:1px solid #2a2a4a;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;color:#c9a84c;font-size:18px;font-weight:700;">${escapeHtml(seriesTitle)}</p>
        <p style="margin:0;color:#9ca3af;font-size:15px;direction:rtl;">${escapeHtml(seriesTitleAr)}</p>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${seriesUrl}" style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
          Explore Now →
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You're receiving this because you opted in to new series notifications on HilalStream.
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
