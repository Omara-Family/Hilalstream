import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { type, to, name, email, subject, message } = await req.json();

    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT") || "465";
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials not configured");
    }

    let emailTo: string;
    let emailSubject: string;
    let emailHtml: string;

    if (type === "contact") {
      emailTo = SMTP_USER;
      emailSubject = `📩 New Contact: ${subject}`;
      emailHtml = buildContactEmail(name!, email!, subject!, message!);
    } else if (type === "welcome") {
      emailTo = to!;
      emailSubject = "🌙 Welcome to HilalStream!";
      emailHtml = buildWelcomeEmail(name!);
    } else {
      throw new Error("Invalid email type");
    }

    // Use nodemailer via npm: specifier (compatible with Deno/Edge Runtime)
    const nodemailer = await import("npm:nodemailer@6.9.16");
    
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HilalStream" <${SMTP_USER}>`,
      to: emailTo,
      subject: emailSubject,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildContactEmail(name: string, email: string, subject: string, message: string) {
  return `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
    <div style="background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#0a0a0a;font-size:22px;">☪ HilalStream</h1>
      <p style="margin:4px 0 0;color:#1a1a2e;font-size:13px;">New Contact Form Message</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:12px 0;color:#9ca3af;font-size:13px;border-bottom:1px solid #2a2a4a;">Name</td><td style="padding:12px 0;color:#f1f1f1;font-size:14px;border-bottom:1px solid #2a2a4a;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:12px 0;color:#9ca3af;font-size:13px;border-bottom:1px solid #2a2a4a;">Email</td><td style="padding:12px 0;color:#f1f1f1;font-size:14px;border-bottom:1px solid #2a2a4a;"><a href="mailto:${escapeHtml(email)}" style="color:#c9a84c;">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:12px 0;color:#9ca3af;font-size:13px;border-bottom:1px solid #2a2a4a;">Subject</td><td style="padding:12px 0;color:#f1f1f1;font-size:14px;border-bottom:1px solid #2a2a4a;">${escapeHtml(subject)}</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#0f0f23;border-radius:12px;border:1px solid #2a2a4a;">
        <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-transform:uppercase;">Message</p>
        <p style="margin:0;color:#e5e5e5;font-size:14px;line-height:1.6;">${escapeHtml(message)}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildWelcomeEmail(name: string) {
  return `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
    <div style="background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">☪</div>
      <h1 style="margin:0;color:#0a0a0a;font-size:28px;font-weight:700;">HilalStream</h1>
      <p style="margin:8px 0 0;color:#1a1a2e;font-size:14px;font-weight:500;">Your Islamic Entertainment Hub</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="margin:0 0 16px;color:#f1f1f1;font-size:24px;">Welcome, ${escapeHtml(name)}! 🎉</h2>
      <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0 0 24px;">
        We're thrilled to have you join the HilalStream community! You now have access to a curated collection of Islamic series, programs, and exclusive content.
      </p>
      <div style="margin-bottom:28px;">
        <div style="padding:16px;background:#0f0f23;border-radius:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
          <p style="margin:0;color:#c9a84c;font-size:14px;font-weight:600;">🎬 Premium Series</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Watch the latest Islamic drama series and documentaries</p>
        </div>
        <div style="padding:16px;background:#0f0f23;border-radius:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
          <p style="margin:0;color:#c9a84c;font-size:14px;font-weight:600;">📺 Programs & Shows</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Explore educational and entertaining Islamic programs</p>
        </div>
        <div style="padding:16px;background:#0f0f23;border-radius:12px;border:1px solid #2a2a4a;">
          <p style="margin:0;color:#c9a84c;font-size:14px;font-weight:600;">❤️ Personalized Experience</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Save favorites, track your progress, and get recommendations</p>
        </div>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://hilal-stream.lovable.app" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#c9a84c 0%,#e8c65a 100%);color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
          Start Watching Now →
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">
        If you have any questions, reply to this email or visit our <a href="https://hilal-stream.lovable.app/contact" style="color:#c9a84c;">Contact Page</a>.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #2a2a4a;text-align:center;">
      <p style="margin:0;color:#4b5563;font-size:12px;">© 2025 HilalStream. All rights reserved.</p>
      <p style="margin:4px 0 0;color:#4b5563;font-size:11px;">You received this because you signed up at HilalStream</p>
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
