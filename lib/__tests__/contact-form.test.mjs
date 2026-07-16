// Focused Contact-form validation and email-generation checks. No test
// framework is configured, so this follows the repository's plain Node
// assertion convention and never calls Resend.
//
// Run with:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs --experimental-strip-types lib/__tests__/contact-form.test.mjs
import {
  CONTACT_REASONS,
  getContactReasonLabel,
  isHoneypotTriggered,
  originsMatch,
  validateContactSubmission,
} from "../contact-form.ts";
import {
  buildContactEmail,
  buildContactIdempotencyKey,
} from "../contact-email.ts";
import { createContactPostHandler } from "../contact-route.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

function submission(overrides = {}) {
  return {
    name: "Taylor Example",
    email: "taylor@example.com",
    company: "Example Company",
    reason: "pricing-and-credits",
    message: "I have a general question about choosing the right review plan.",
    acknowledgment: true,
    website: "",
    submissionId: "2f1c2e6a-12b4-4d8a-9fc2-c8432ed58e15",
    ...overrides,
  };
}

const valid = validateContactSubmission(submission());
check("1. valid submission is accepted", valid.success);

const missing = validateContactSubmission(
  submission({ name: "", email: "", reason: "", message: "", acknowledgment: false }),
);
check(
  "2. required-field failures are structured",
  !missing.success &&
    missing.errors.name === "required" &&
    missing.errors.email === "required" &&
    missing.errors.reason === "required" &&
    missing.errors.message === "required",
);

const invalidEmail = validateContactSubmission(submission({ email: "not-an-email" }));
check("3. invalid email is rejected", !invalidEmail.success && invalidEmail.errors.email === "invalid");

const injectedEmail = validateContactSubmission(
  submission({ email: "taylor@example.com\r\nBcc: attacker@example.com" }),
);
check(
  "4. CR/LF header injection is rejected",
  !injectedEmail.success && injectedEmail.errors.email === "invalid",
);

const unknownReason = validateContactSubmission(submission({ reason: "customer-subject" }));
check(
  "5. unknown reason is rejected",
  !unknownReason.success && unknownReason.errors.reason === "invalid",
);

const oversized = validateContactSubmission(
  submission({
    name: "n".repeat(101),
    company: "c".repeat(121),
    message: "m".repeat(3_001),
  }),
);
check(
  "6. oversized fields are rejected",
  !oversized.success &&
    oversized.errors.name === "too_long" &&
    oversized.errors.company === "too_long" &&
    oversized.errors.message === "too_long",
);

const unacknowledged = validateContactSubmission(submission({ acknowledgment: false }));
check(
  "7. acknowledgment=false is rejected",
  !unacknowledged.success && unacknowledged.errors.acknowledgment === "must_accept",
);

const invalidSubmissionId = validateContactSubmission(submission({ submissionId: "not-a-uuid" }));
check(
  "8. invalid submissionId is rejected",
  !invalidSubmissionId.success && invalidSubmissionId.errors.submissionId === "invalid",
);

const emptyCompany = validateContactSubmission(submission({ company: "   " }));
check(
  "9. optional company is accepted when empty",
  emptyCompany.success && emptyCompany.data.company === "",
);

check(
  "10. honeypot detects filled website and ignores empty website",
  isHoneypotTriggered(submission({ website: "https://bot.example" })) &&
    !isHoneypotTriggered(submission({ website: "  " })),
);

check(
  "11. every allowed reason has a fixed safe label",
  CONTACT_REASONS.every(
    ({ value, label }) => getContactReasonLabel(value) === label && !/[\r\n]/.test(label),
  ) && getContactReasonLabel("not-allowed") === undefined,
);

const injectionValidation = validateContactSubmission(
  submission({
    name: "<script>alert('name')</script>",
    company: "<b>Injected Company</b>",
    message: "<img src=x onerror=alert('message')> This is unsafe markup.",
  }),
);
const generated = injectionValidation.success
  ? buildContactEmail(injectionValidation.data, new Date("2026-07-15T12:00:00.000Z"))
  : null;
check(
  "12. generated HTML escapes customer markup and text remains plain text",
  generated !== null &&
    !generated.html.includes("<script>") &&
    !generated.html.includes("<img src=x") &&
    generated.html.includes("&lt;script&gt;") &&
    generated.html.includes("&lt;img src=x") &&
    generated.text.includes("<img src=x onerror=alert('message')>"),
);

const firstKey = buildContactIdempotencyKey(submission().submissionId);
const secondKey = buildContactIdempotencyKey(submission().submissionId);
check(
  "13. the same submission ID produces the same safely prefixed idempotency key",
  firstKey === secondKey && firstKey === `subshield-contact-${submission().submissionId}`,
);

check(
  "14. same-origin matching supports production, previews, and localhost",
  originsMatch("https://www.subshield.net/api/contact", "https://www.subshield.net") &&
    originsMatch("https://feature-branch.vercel.app/api/contact", "https://feature-branch.vercel.app") &&
    originsMatch("http://localhost:3000/api/contact", "http://localhost:3000") &&
    !originsMatch("https://www.subshield.net/api/contact", "https://attacker.example") &&
    !originsMatch("https://www.subshield.net/api/contact", null),
);

const testConfiguration = {
  apiKey: "test-token",
  toEmail: "contact-destination@example.com",
  fromEmail: "contact-sender@example.com",
};
const deliveries = [];
const diagnostics = [];
const successfulHandler = createContactPostHandler({
  getConfiguration: () => testConfiguration,
  deliver: async (delivery) => {
    deliveries.push(delivery);
    return true;
  },
  diagnose: (message) => diagnostics.push(message),
  now: () => new Date("2026-07-15T12:00:00.000Z"),
});
const successfulResponse = await successfulHandler(
  new Request("https://www.subshield.net/api/contact", {
    method: "POST",
    headers: {
      Origin: "https://www.subshield.net",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission()),
  }),
);
check(
  "15. route-level accepted delivery returns success without a live provider call",
  successfulResponse.status === 200 &&
    (await successfulResponse.json()).ok === true &&
    deliveries.length === 1 &&
    deliveries[0].idempotencyKey === firstKey &&
    deliveries[0].subject === "[SubShield Contact] Pricing and Credits" &&
    diagnostics.length === 0,
);

for (const [label, deliver] of [
  ["SDK-returned failure", async () => false],
  ["thrown provider failure", async () => { throw new Error("mock failure"); }],
]) {
  const handler = createContactPostHandler({
    getConfiguration: () => testConfiguration,
    deliver,
    diagnose: (message) => diagnostics.push(message),
  });
  const response = await handler(
    new Request("https://www.subshield.net/api/contact", {
      method: "POST",
      headers: {
        Origin: "https://www.subshield.net",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission()),
    }),
  );
  const responseBody = await response.json();
  check(
    `16. ${label} returns only a generic safe error`,
    response.status === 502 &&
      responseBody.error === "delivery_failed" &&
      Object.keys(responseBody).length === 2,
  );
}

let honeypotDeliveries = 0;
const unavailableHandler = createContactPostHandler({
  getConfiguration: () => null,
  deliver: async () => {
    honeypotDeliveries += 1;
    return true;
  },
  diagnose: (message) => diagnostics.push(message),
});
const honeypotResponse = await unavailableHandler(
  new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission({ website: "filled-by-bot" })),
  }),
);
check(
  "17. route honeypot returns generic success before configuration or delivery",
  honeypotResponse.status === 200 &&
    (await honeypotResponse.json()).ok === true &&
    honeypotDeliveries === 0,
);

const unavailableResponse = await unavailableHandler(
  new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission()),
  }),
);
check(
  "18. missing request-time configuration returns a generic 503",
  unavailableResponse.status === 503 &&
    (await unavailableResponse.json()).error === "service_unavailable" &&
    honeypotDeliveries === 0,
);

const oversizedResponse = await successfulHandler(
  new Request("https://www.subshield.net/api/contact", {
    method: "POST",
    headers: {
      Origin: "https://www.subshield.net",
      "Content-Type": "application/json",
      "Content-Length": "20000",
    },
    body: JSON.stringify(submission()),
  }),
);
check("19. declared oversized request is rejected", oversizedResponse.status === 413);

if (failures > 0) process.exit(1);
console.log("\nAll Contact-form checks passed.");
