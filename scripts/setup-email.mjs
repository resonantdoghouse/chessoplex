/**
 * Configures Supabase auth to send emails via Resend's SMTP relay.
 * Uses onboarding@resend.dev as the sender for testing (no domain verification needed).
 * For production, replace SMTP_FROM with a verified domain address.
 *
 * Usage: node scripts/setup-email.mjs
 * Required env vars: SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, RESEND_API_KEY
 */

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const resendKey = process.env.RESEND_API_KEY;

if (!ref || !token || !resendKey) {
  console.error("ERROR: SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, and RESEND_API_KEY must be set");
  process.exit(1);
}

const smtpConfig = {
  smtp_admin_email: "onboarding@resend.dev",
  smtp_host: "smtp.resend.com",
  smtp_port: "465",
  smtp_user: "resend",
  smtp_pass: resendKey,
  smtp_sender_name: "Chessoplex",
};

console.log("Configuring Supabase SMTP → Resend for project:", ref);
console.log("Sender:", smtpConfig.smtp_admin_email);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(smtpConfig),
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("Failed:", res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("✓ SMTP configured. Test by triggering a magic link in the app.");
console.log("  Note: onboarding@resend.dev can only send to your Resend account email.");
console.log("  To send to any address, verify a domain at resend.com/domains.");
