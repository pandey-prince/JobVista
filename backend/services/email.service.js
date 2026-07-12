const RESEND_API_URL = "https://api.resend.com/emails";

const getFromAddress = () =>
  process.env.EMAIL_FROM || "JobLeLo <onboarding@resend.dev>";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Send a transactional email via Resend.
 * Skips silently when RESEND_API_KEY is not set (dev-friendly).
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — email not sent:", subject);
    return { success: false, skipped: true };
  }

  if (!to || !subject || (!html && !text)) {
    throw new Error("Email requires to, subject, and html or text");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || "Failed to send email";
    throw new Error(message);
  }

  return { success: true, id: data.id };
};

export const sendTestEmail = async (to) => {
  return sendEmail({
    to,
    subject: "JobLeLo email alerts are working",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #6A38C2;">JobLeLo</h2>
        <p>Your email alerts are set up correctly. You'll receive job notifications here.</p>
        <p style="color: #666; font-size: 14px;">Fresh IT jobs from company career pages.</p>
      </div>
    `,
    text: "JobLeLo email alerts are working. You'll receive job notifications here.",
  });
};
