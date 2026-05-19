import { Resend } from "resend";
import type { FastifyBaseLogger } from "fastify";

const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendEmail(to: string, subject: string, body: string, logger?: FastifyBaseLogger) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger?.warn({ to, subject }, "RESEND_API_KEY is not set; skipped email");
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
    `,
  });
}

export async function sendVerificationEmail(to: string, url: string, logger?: FastifyBaseLogger) {
  await sendEmail(to, "Verify your LocalLink email", url, logger);
}

export async function sendPasswordResetEmail(to: string, url: string, logger?: FastifyBaseLogger) {
  await sendEmail(to, "Reset your LocalLink password", url, logger);
}
