import { Resend } from "resend";

const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY is not set; skipped "${subject}" email to ${to}: ${body}`);
    return;
  }

  const resend = new Resend(apiKey);
  const escapedBody = escapeHtml(body);
  await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <p>${escapedBody}</p>
      <p><a href="${escapedBody}">${escapedBody}</a></p>
    `
  });
}

export async function sendVerificationEmail(to: string, url: string) {
  await sendEmail(to, "Verify your LocalLink email", url);
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await sendEmail(to, "Reset your LocalLink password", url);
}
