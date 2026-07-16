import {
  getContactReasonLabel,
  type ContactSubmission,
} from "./contact-form";

const SENSITIVE_INFORMATION_REMINDER =
  "The customer was instructed not to send confidential contract contents or other unnecessary sensitive information.";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function htmlValue(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function buildContactIdempotencyKey(submissionId: string): string {
  return `subshield-contact-${submissionId}`;
}

export function buildContactEmail(
  submission: ContactSubmission,
  submittedAt: Date,
): { subject: string; html: string; text: string } {
  const reasonLabel = getContactReasonLabel(submission.reason);
  if (!reasonLabel) throw new Error("A validated Contact reason is required.");

  const timestamp = submittedAt.toISOString();
  const companyHtml = submission.company
    ? `<tr><th align="left" style="padding:8px 12px 8px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Company</th><td style="padding:8px 24px 8px 12px;color:#0a192f;font-size:14px;">${htmlValue(submission.company)}</td></tr>`
    : "";
  const companyText = submission.company ? [`Company: ${submission.company}`] : [];

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,sans-serif;">
    <main style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#0a192f;color:#ffffff;padding:22px 24px;">
        <h1 style="margin:0;font-size:20px;">SubShield Contact Request</h1>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr><th align="left" style="padding:18px 12px 8px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Name</th><td style="padding:18px 24px 8px 12px;color:#0a192f;font-size:14px;">${htmlValue(submission.name)}</td></tr>
          <tr><th align="left" style="padding:8px 12px 8px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Customer email</th><td style="padding:8px 24px 8px 12px;color:#0a192f;font-size:14px;">${htmlValue(submission.email)}</td></tr>
          ${companyHtml}
          <tr><th align="left" style="padding:8px 12px 8px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Reason</th><td style="padding:8px 24px 8px 12px;color:#0a192f;font-size:14px;">${escapeHtml(reasonLabel)}</td></tr>
          <tr><th align="left" style="padding:8px 12px 8px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Submitted</th><td style="padding:8px 24px 8px 12px;color:#0a192f;font-size:14px;">${escapeHtml(timestamp)}</td></tr>
          <tr><th align="left" style="padding:8px 12px 18px 24px;color:#596a7d;font-size:13px;vertical-align:top;">Submission ID</th><td style="padding:8px 24px 18px 12px;color:#0a192f;font-size:14px;">${escapeHtml(submission.submissionId)}</td></tr>
        </tbody>
      </table>
      <section style="padding:20px 24px;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 10px;color:#1a3668;font-size:14px;text-transform:uppercase;">Message</h2>
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${htmlValue(submission.message)}</p>
      </section>
      <p style="margin:0;padding:16px 24px;background:#fff7ed;color:#9a3412;font-size:12px;line-height:1.5;">${escapeHtml(SENSITIVE_INFORMATION_REMINDER)}</p>
    </main>
  </body>
</html>`;

  const text = [
    "SubShield Contact Request",
    "",
    `Name: ${submission.name}`,
    `Customer email: ${submission.email}`,
    ...companyText,
    `Reason: ${reasonLabel}`,
    `Submitted: ${timestamp}`,
    `Submission ID: ${submission.submissionId}`,
    "",
    "Message:",
    submission.message,
    "",
    SENSITIVE_INFORMATION_REMINDER,
  ].join("\n");

  return {
    subject: `[SubShield Contact] ${reasonLabel}`,
    html,
    text,
  };
}
