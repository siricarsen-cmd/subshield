import {
  isHoneypotTriggered,
  originsMatch,
  validateContactSubmission,
  type ContactSubmission,
} from "./contact-form";
import { buildContactEmail, buildContactIdempotencyKey } from "./contact-email";

export type ContactConfiguration = {
  apiKey: string;
  toEmail: string;
  fromEmail: string;
};

export type ContactDelivery = {
  configuration: ContactConfiguration;
  submission: ContactSubmission;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

type ContactRouteDependencies = {
  getConfiguration: () => ContactConfiguration | null;
  deliver: (delivery: ContactDelivery) => Promise<boolean>;
  diagnose: (message: string) => void;
  now?: () => Date;
};

const MAX_BODY_BYTES = 16 * 1024;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function createContactPostHandler({
  getConfiguration,
  deliver,
  diagnose,
  now = () => new Date(),
}: ContactRouteDependencies) {
  return async function POST(request: Request) {
    if (!originsMatch(request.url, request.headers.get("origin"))) {
      return jsonResponse({ ok: false, error: "forbidden" }, 403);
    }

    const contentType = request.headers.get("content-type");
    if (contentType?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return jsonResponse({ ok: false, error: "unsupported_media_type" }, 415);
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
      const declaredBytes = Number(contentLength);
      if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0) {
        return jsonResponse({ ok: false, error: "invalid_request" }, 400);
      }
      if (declaredBytes > MAX_BODY_BYTES) {
        return jsonResponse({ ok: false, error: "request_too_large" }, 413);
      }
    }

    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return jsonResponse({ ok: false, error: "invalid_request" }, 400);
    }

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: "request_too_large" }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ ok: false, error: "invalid_json" }, 400);
    }

    if (isHoneypotTriggered(body)) {
      return jsonResponse({ ok: true });
    }

    const validation = validateContactSubmission(body);
    if (!validation.success) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_submission",
          fields: Object.keys(validation.errors),
        },
        400,
      );
    }

    const configuration = getConfiguration();
    if (!configuration) {
      diagnose("[contact] Delivery configuration is unavailable.");
      return jsonResponse({ ok: false, error: "service_unavailable" }, 503);
    }

    const email = buildContactEmail(validation.data, now());
    const delivery: ContactDelivery = {
      configuration,
      submission: validation.data,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: buildContactIdempotencyKey(validation.data.submissionId),
    };

    try {
      if (!(await deliver(delivery))) {
        diagnose("[contact] Email delivery was not accepted.");
        return jsonResponse({ ok: false, error: "delivery_failed" }, 502);
      }
    } catch {
      diagnose("[contact] Email delivery failed.");
      return jsonResponse({ ok: false, error: "delivery_failed" }, 502);
    }

    return jsonResponse({ ok: true });
  };
}
