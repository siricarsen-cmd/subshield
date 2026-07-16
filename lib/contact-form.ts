export const CONTACT_REASONS = [
  { value: "pre-review-question", label: "Pre-Review Question" },
  { value: "existing-review-help", label: "Existing Review Help" },
  { value: "document-types", label: "Document Types" },
  { value: "pricing-and-credits", label: "Pricing and Credits" },
  { value: "technical-issue", label: "Technical Issue" },
  { value: "privacy-question", label: "Privacy Question" },
  { value: "other", label: "Other" },
] as const;

export const CONTACT_FIELD_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  company: { max: 120 },
  message: { min: 20, max: 3_000 },
} as const;

export type ContactReason = (typeof CONTACT_REASONS)[number]["value"];

export type ContactSubmission = {
  name: string;
  email: string;
  company: string;
  reason: ContactReason;
  message: string;
  acknowledgment: true;
  website: string;
  submissionId: string;
};

export type ContactField = keyof ContactSubmission;
export type ContactValidationError =
  | "required"
  | "invalid"
  | "too_short"
  | "too_long"
  | "must_accept";
export type ContactFieldErrors = Partial<Record<ContactField, ContactValidationError>>;

export type ContactValidationResult =
  | { success: true; data: ContactSubmission }
  | { success: false; errors: ContactFieldErrors };

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasHeaderInjection(value: string): boolean {
  return /[\r\n]/.test(value);
}

export function isValidEmailAddress(value: string): boolean {
  if (hasHeaderInjection(value)) return false;

  const email = value.trim();
  if (email.length === 0 || email.length > CONTACT_FIELD_LIMITS.email.max) return false;
  if (email.includes("..")) return false;
  const localPart = email.split("@", 1)[0];
  if (localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".")) return false;

  return EMAIL_PATTERN.test(email);
}

export function getContactReasonLabel(value: string): string | undefined {
  return CONTACT_REASONS.find((reason) => reason.value === value)?.label;
}

export function isHoneypotTriggered(value: unknown): boolean {
  return isRecord(value) && typeof value.website === "string" && value.website.trim().length > 0;
}

export function originsMatch(requestUrl: string, originHeader: string | null): boolean {
  if (!originHeader) return false;

  try {
    const requestOrigin = new URL(requestUrl).origin;
    const suppliedOrigin = new URL(originHeader);

    return suppliedOrigin.origin === originHeader && suppliedOrigin.origin === requestOrigin;
  } catch {
    return false;
  }
}

function requiredText(
  value: unknown,
  limits: { min: number; max: number },
): { value: string; error?: ContactValidationError } {
  if (typeof value !== "string") return { value: "", error: "required" };

  const normalized = value.trim();
  if (!normalized) return { value: "", error: "required" };
  if (normalized.length < limits.min) return { value: normalized, error: "too_short" };
  if (normalized.length > limits.max) return { value: normalized, error: "too_long" };

  return { value: normalized };
}

export function validateContactSubmission(value: unknown): ContactValidationResult {
  if (!isRecord(value)) return { success: false, errors: { name: "required" } };

  const errors: ContactFieldErrors = {};

  const nameResult = requiredText(value.name, CONTACT_FIELD_LIMITS.name);
  if (nameResult.error) errors.name = nameResult.error;

  let email = "";
  if (typeof value.email !== "string" || value.email.trim().length === 0) {
    errors.email = "required";
  } else {
    email = value.email.trim();
    if (!isValidEmailAddress(value.email)) errors.email = "invalid";
  }

  let company = "";
  if (value.company !== undefined) {
    if (typeof value.company !== "string") {
      errors.company = "invalid";
    } else {
      company = value.company.trim();
      if (company.length > CONTACT_FIELD_LIMITS.company.max) errors.company = "too_long";
    }
  }

  let reason: ContactReason = "other";
  if (typeof value.reason !== "string" || value.reason.length === 0) {
    errors.reason = "required";
  } else if (!getContactReasonLabel(value.reason)) {
    errors.reason = "invalid";
  } else {
    reason = value.reason as ContactReason;
  }

  const messageResult = requiredText(value.message, CONTACT_FIELD_LIMITS.message);
  if (messageResult.error) errors.message = messageResult.error;

  if (value.acknowledgment !== true) errors.acknowledgment = "must_accept";

  let website = "";
  if (value.website !== undefined) {
    if (typeof value.website !== "string") {
      errors.website = "invalid";
    } else {
      website = value.website.trim();
    }
  }

  let submissionId = "";
  if (typeof value.submissionId !== "string" || !UUID_PATTERN.test(value.submissionId)) {
    errors.submissionId = "invalid";
  } else {
    submissionId = value.submissionId;
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      name: nameResult.value,
      email,
      company,
      reason,
      message: messageResult.value,
      acknowledgment: true,
      website,
      submissionId,
    },
  };
}
