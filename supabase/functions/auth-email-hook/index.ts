// Supabase Auth "Send Email" Hook
// Routes auth emails (signup, recovery, magic link, invite, email_change, reauth)
// through Resend on the verified elyphant.ai domain.
//
// Setup:
// 1. Deploy this function (verify_jwt = false).
// 2. In Supabase Dashboard → Authentication → Hooks → "Send Email Hook":
//    - URL: https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/auth-email-hook
//    - Secret: value of SEND_EMAIL_HOOK_SECRET env var (starts with "whsec_...")
//
// Reuses the same Resend sender config as ecommerce-email-orchestrator
// (RESEND_API_KEY, RESEND_FROM_NAME, RESEND_FROM_EMAIL).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

interface EmailActionPayload {
  user: { email: string; user_metadata?: Record<string, unknown> };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | "signup"
      | "recovery"
      | "magiclink"
      | "invite"
      | "email_change"
      | "email_change_current"
      | "email_change_new"
      | "reauthentication";
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function buildActionUrl(p: EmailActionPayload): string {
  const { site_url, token_hash, email_action_type, redirect_to } = p.email_data;
  // site_url may already include /auth/v1 (Supabase sends the auth API base).
  // Normalize to the project root, then append /auth/v1/verify exactly once.
  const root = site_url.replace(/\/$/, "").replace(/\/auth\/v1$/, "");

  if (email_action_type === "recovery") {
    const resetUrl = new URL(redirect_to || "https://elyphant.ai/reset-password");
    if (resetUrl.pathname === "/reset-password-launch" || resetUrl.pathname === "/reset-password/launch") {
      resetUrl.pathname = "/reset-password";
    }
    resetUrl.searchParams.set("token_hash", token_hash);
    resetUrl.searchParams.set("type", "recovery");
    return resetUrl.toString();
  }

  const params = new URLSearchParams({
    token_hash,
    type: email_action_type,
    redirect_to: redirect_to || `${root}/`,
  });
  return `${root}/auth/v1/verify?${params.toString()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTemplate(payload: EmailActionPayload): { subject: string; html: string } {
  const type = payload.email_data.email_action_type;
  const actionUrl = buildActionUrl(payload);
  const token = payload.email_data.token;

  const config: Record<string, { subject: string; heading: string; body: string; cta: string }> = {
    signup: {
      subject: "Confirm your Elyphant account",
      heading: "Welcome to Elyphant",
      body: "Tap the button below to confirm your email address and finish setting up your account.",
      cta: "Confirm email",
    },
    recovery: {
      subject: "Reset your Elyphant password",
      heading: "Reset your password",
      body: "We received a request to reset the password for your Elyphant account. Tap the button below to choose a new password. If you didn't request this, you can safely ignore this email.",
      cta: "Reset password",
    },
    magiclink: {
      subject: "Your Elyphant sign-in link",
      heading: "Sign in to Elyphant",
      body: "Tap the button below to sign in. This link will expire shortly.",
      cta: "Sign in",
    },
    invite: {
      subject: "You're invited to Elyphant",
      heading: "You've been invited",
      body: "You've been invited to join Elyphant. Tap below to accept the invitation and create your account.",
      cta: "Accept invitation",
    },
    email_change: {
      subject: "Confirm your new email",
      heading: "Confirm your new email",
      body: "Tap below to confirm your new email address for Elyphant.",
      cta: "Confirm email",
    },
    email_change_current: {
      subject: "Confirm your email change",
      heading: "Confirm email change",
      body: "Tap below to confirm the email change request on your Elyphant account.",
      cta: "Confirm change",
    },
    email_change_new: {
      subject: "Confirm your new email",
      heading: "Confirm your new email",
      body: "Tap below to confirm your new email address for Elyphant.",
      cta: "Confirm email",
    },
    reauthentication: {
      subject: "Your Elyphant verification code",
      heading: "Verification code",
      body: `Use this code to verify your identity: <strong style="font-size:24px;letter-spacing:4px;">${token}</strong>`,
      cta: "",
    },
  };

  const c = config[type] ?? config.magiclink;
  const escapedActionUrl = escapeHtml(actionUrl);

  const button = c.cta
    ? `<table border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
         <tr><td style="background-color:#000;border-radius:4px;">
           <a href="${escapedActionUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${fontStack};font-size:15px;font-weight:600;color:#fff;text-decoration:none;letter-spacing:0.5px;">${c.cta}</a>
         </td></tr>
       </table>
       <p style="margin:0 0 8px;font-family:${fontStack};font-size:13px;color:#666;">Or paste this link into your browser:</p>
       <p style="margin:0 0 24px;font-family:${fontStack};font-size:12px;color:#999;word-break:break-all;"><a href="${escapedActionUrl}" style="color:#999;">${escapedActionUrl}</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.subject}</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5;">
    <tr><td align="center" style="padding:40px 10px;">
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#fff;max-width:600px;">
        <tr><td style="padding:48px 48px 24px;">
          <p style="margin:0 0 8px;font-family:${fontStack};font-size:13px;letter-spacing:2px;color:#999;text-transform:uppercase;">Elyphant</p>
          <h1 style="margin:0 0 24px;font-family:${fontStack};font-size:28px;font-weight:600;color:#000;line-height:1.2;">${c.heading}</h1>
          <p style="margin:0 0 16px;font-family:${fontStack};font-size:15px;line-height:1.6;color:#333;">${c.body}</p>
          ${button}
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;">
          <p style="margin:0;font-family:${fontStack};font-size:12px;color:#999;line-height:1.5;">
            If you didn't request this email, you can safely ignore it.<br>
            Elyphant · <a href="https://elyphant.ai" style="color:#999;">elyphant.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject: c.subject, html };
}

async function sendViaResend(to: string, subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const fromName = Deno.env.get("RESEND_FROM_NAME") || "Elyphant";
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "notifications@elyphant.ai";
  const senderAddress = `${fromName} <${fromEmail}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: senderAddress, to: [to], subject, html }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API error: ${errorText}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET")?.replace(/^v\d+,/, "");
    if (!hookSecret) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");

    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify Standard Webhooks signature from Supabase Auth
    const wh = new Webhook(hookSecret);
    const payload = wh.verify(rawBody, headers) as EmailActionPayload;

    const { subject, html } = renderTemplate(payload);
    const result = await sendViaResend(payload.user.email, subject, html);

    console.log(
      `✅ Auth email sent: type=${payload.email_data.email_action_type} to=${payload.user.email} id=${result.id}`,
    );

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ auth-email-hook error:", error?.message || error);
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: error?.message || "Failed to send auth email" },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
