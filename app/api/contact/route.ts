import { Resend } from "resend";
import { isValidEmailAddress } from "@/lib/contact-form";
import {
  createContactPostHandler,
  type ContactConfiguration,
  type ContactDelivery,
} from "@/lib/contact-route";

export const runtime = "nodejs";

function getContactConfiguration(): ContactConfiguration | null {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (
    !apiKey?.trim() ||
    /[\r\n]/.test(apiKey) ||
    !toEmail ||
    !isValidEmailAddress(toEmail) ||
    !fromEmail ||
    !isValidEmailAddress(fromEmail)
  ) {
    return null;
  }

  return {
    apiKey: apiKey.trim(),
    toEmail: toEmail.trim(),
    fromEmail: fromEmail.trim(),
  };
}

async function deliverContactEmail({
  configuration,
  submission,
  subject,
  html,
  text,
  idempotencyKey,
}: ContactDelivery): Promise<boolean> {
  const resend = new Resend(configuration.apiKey);
  const result = await resend.emails.send(
    {
      from: `SubShield Website <${configuration.fromEmail}>`,
      to: configuration.toEmail,
      replyTo: submission.email,
      subject,
      html,
      text,
    },
    { idempotencyKey },
  );

  return Boolean(result.data) && !result.error;
}

export const POST = createContactPostHandler({
  getConfiguration: getContactConfiguration,
  deliver: deliverContactEmail,
  diagnose: (message) => console.error(message),
});
