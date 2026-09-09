import sgMail from "@sendgrid/mail";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY environment variable is not set");
  }
  sgMail.setApiKey(apiKey);
  configured = true;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME ?? "CobroFlow";
  if (!fromEmail) {
    return { ok: false, error: "SENDGRID_FROM_EMAIL environment variable is not set" };
  }

  try {
    ensureConfigured();
    await sgMail.send({
      to: input.to,
      from: { email: fromEmail, name: fromName },
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown SendGrid error" };
  }
}
