"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  CONTACT_FIELD_LIMITS,
  CONTACT_REASONS,
  validateContactSubmission,
  type ContactField,
  type ContactFieldErrors,
  type ContactValidationError,
} from "@/lib/contact-form";

type FormValues = {
  name: string;
  email: string;
  company: string;
  reason: string;
  message: string;
  acknowledgment: boolean;
  website: string;
};

type DeliveryStatus = "idle" | "submitting" | "success" | "error";

const INITIAL_FORM: FormValues = {
  name: "",
  email: "",
  company: "",
  reason: "",
  message: "",
  acknowledgment: false,
  website: "",
};

function fieldErrorMessage(
  field: ContactField,
  error: ContactValidationError,
): string {
  if (field === "acknowledgment") {
    return "Please confirm that you understand the sensitive-information warning.";
  }
  if (field === "email") {
    return error === "required"
      ? "Enter your email address."
      : "Enter a valid email address.";
  }
  if (field === "reason") {
    return error === "required"
      ? "Select what we can help with."
      : "Select one of the available reasons.";
  }
  if (field === "name") {
    if (error === "too_short") return "Enter at least 2 characters.";
    if (error === "too_long") return "Keep your name to 100 characters or fewer.";
    return "Enter your full name.";
  }
  if (field === "company") {
    return "Keep your company name to 120 characters or fewer.";
  }
  if (field === "message") {
    if (error === "too_short") return "Enter at least 20 characters.";
    if (error === "too_long") return "Keep your message to 3,000 characters or fewer.";
    return "Enter a brief message.";
  }
  return "Check this field and try again.";
}

function InlineError({
  id,
  field,
  error,
}: {
  id: string;
  field: ContactField;
  error?: ContactValidationError;
}) {
  if (!error) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-bold text-red-700">
      {fieldErrorMessage(field, error)}
    </p>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const attemptRef = useRef<{ formSnapshot: string; submissionId: string } | null>(null);

  const isSubmitting = status === "submitting";

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "submitting") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formSnapshot = JSON.stringify(form);
    if (!attemptRef.current || attemptRef.current.formSnapshot !== formSnapshot) {
      attemptRef.current = {
        formSnapshot,
        submissionId: crypto.randomUUID(),
      };
    }

    const payload = {
      ...form,
      submissionId: attemptRef.current.submissionId,
    };
    const validation = validateContactSubmission(payload);

    if (!validation.success) {
      setErrors(validation.errors);
      setStatus("idle");
      const firstInvalidField = Object.keys(validation.errors)[0];
      if (firstInvalidField) document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);
      const delivered =
        response.ok &&
        typeof result === "object" &&
        result !== null &&
        "ok" in result &&
        result.ok === true;

      if (!delivered) throw new Error("Contact delivery was not accepted.");

      setForm(INITIAL_FORM);
      attemptRef.current = null;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 border-b border-slate-100 pb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#1A3668]">
            Contact Us
          </h1>
          <p className="mt-2 text-base font-bold uppercase tracking-wide text-[#596A7D]">
            Questions Before You Start?
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Before You Send Sensitive Information
              </h2>
              <p className="text-sm font-medium leading-relaxed text-[#596A7D]">
                Send only a brief summary of your general question. Do not include
                confidential contract language, classified or export-controlled
                information, CUI, passwords, payment-card data, Social Security
                numbers, medical records, or other unnecessary sensitive
                information. Submit supported review documents only through your
                account dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Common Reasons to Contact Us
              </h2>
              <ul className="space-y-2 text-sm font-bold text-[#596A7D]">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-[#FF5F1F]" aria-hidden="true">
                    •
                  </span>
                  <span>You are not sure whether your document fits SubShield</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-[#FF5F1F]" aria-hidden="true">
                    •
                  </span>
                  <span>You have questions about pricing, plans, or review credits</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-[#FF5F1F]" aria-hidden="true">
                    •
                  </span>
                  <span>You need help with an existing review</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-[#FF5F1F]" aria-hidden="true">
                    •
                  </span>
                  <span>You are encountering an upload or portal issue</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#1A3668]">
                Service Disclaimer
              </h2>
              <p className="text-xs font-medium leading-relaxed text-[#596A7D]">
                SubShield is an AI-assisted contract risk-screening tool, not a
                law firm. This form supports general questions about platform
                features, supported document intake, privacy, and credit billing.
                SubShield cannot provide legal advice, contract interpretations,
                or legal opinions.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div className="mb-7 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
                General Questions and Support
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#1A3668]">
                Send a Message
              </h2>
              <p className="text-sm font-medium leading-relaxed text-[#596A7D]">
                Tell us how we can help without including sensitive contract
                details. All fields marked with an asterisk are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-70">
                <legend className="sr-only">Contact information and message</legend>

                <div
                  className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                  aria-hidden="true"
                >
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={form.website}
                    onChange={(event) => updateField("website", event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#1A3668]"
                    >
                      Full Name <span className="text-[#FF5F1F]">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      minLength={CONTACT_FIELD_LIMITS.name.min}
                      maxLength={CONTACT_FIELD_LIMITS.name.max}
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#FF5F1F] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
                    />
                    <InlineError id="name-error" field="name" error={errors.name} />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#1A3668]"
                    >
                      Email Address <span className="text-[#FF5F1F]">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      maxLength={CONTACT_FIELD_LIMITS.email.max}
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#FF5F1F] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
                    />
                    <InlineError id="email-error" field="email" error={errors.email} />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#1A3668]"
                  >
                    Company <span className="font-bold normal-case tracking-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    maxLength={CONTACT_FIELD_LIMITS.company.max}
                    autoComplete="organization"
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? "company-error" : undefined}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#FF5F1F] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
                  />
                  <InlineError id="company-error" field="company" error={errors.company} />
                </div>

                <div>
                  <label
                    htmlFor="reason"
                    className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[#1A3668]"
                  >
                    What can we help with? <span className="text-[#FF5F1F]">*</span>
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={(event) => updateField("reason", event.target.value)}
                    required
                    aria-invalid={Boolean(errors.reason)}
                    aria-describedby={errors.reason ? "reason-error" : undefined}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#FF5F1F] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a reason</option>
                    {CONTACT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  <InlineError id="reason-error" field="reason" error={errors.reason} />
                </div>

                <div>
                  <div className="mb-1.5 flex items-end justify-between gap-4">
                    <label
                      htmlFor="message"
                      className="block text-xs font-black uppercase tracking-wider text-[#1A3668]"
                    >
                      Message <span className="text-[#FF5F1F]">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-slate-500">
                      {form.message.length}/{CONTACT_FIELD_LIMITS.message.max}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    minLength={CONTACT_FIELD_LIMITS.message.min}
                    maxLength={CONTACT_FIELD_LIMITS.message.max}
                    rows={7}
                    required
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message
                        ? "message-guidance message-error"
                        : "message-guidance"
                    }
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none transition focus:border-[#FF5F1F] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed"
                  />
                  <p id="message-guidance" className="mt-1.5 text-xs font-medium text-slate-500">
                    Provide only the context needed to answer your general question.
                  </p>
                  <InlineError id="message-error" field="message" error={errors.message} />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="acknowledgment"
                      name="acknowledgment"
                      type="checkbox"
                      checked={form.acknowledgment}
                      onChange={(event) =>
                        updateField("acknowledgment", event.target.checked)
                      }
                      required
                      aria-invalid={Boolean(errors.acknowledgment)}
                      aria-describedby={
                        errors.acknowledgment ? "acknowledgment-error" : undefined
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#FF5F1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3668]"
                    />
                    <label
                      htmlFor="acknowledgment"
                      className="text-xs font-bold leading-relaxed text-amber-950"
                    >
                      I understand that I should not include confidential contract
                      language, classified information, export-controlled
                      information, CUI, passwords, payment-card data, Social
                      Security numbers, medical records, or other unnecessary
                      sensitive information.
                    </label>
                  </div>
                  <InlineError
                    id="acknowledgment-error"
                    field="acknowledgment"
                    error={errors.acknowledgment}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#FF5F1F] px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#1A3668] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3668] disabled:cursor-not-allowed disabled:bg-slate-400 sm:text-sm"
                >
                  {isSubmitting ? "Sending Message..." : "Send Message"}
                </button>
              </fieldset>

              <div className="mt-4 min-h-12">
                {status === "submitting" && (
                  <p role="status" aria-live="polite" className="text-sm font-bold text-[#1A3668]">
                    Sending your message...
                  </p>
                )}
                {status === "success" && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-relaxed text-emerald-900"
                  >
                    Thank you. Your message was delivered to SubShield. We’ll
                    review it and respond to the email address you provided.
                  </p>
                )}
                {status === "error" && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800"
                  >
                    Your message could not be delivered. Please try again later.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-6 border-t border-slate-200 pt-16 text-center">
          <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-[#1A3668] md:text-4xl">
            Ready to review the package before you commit?
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-[#596A7D]">
            Upload your prime-provided subcontract, teaming, or bid package.
            SubShield will flag common risk areas, missing documents, and
            negotiation questions so you can go back to the prime before final
            attorney review.
          </p>
          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-[#FF5F1F] px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#1A3668] sm:text-sm"
            >
              See Plans
            </Link>
            <Link
              href="/sample-report"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-[#1A3668] shadow-sm transition-all hover:bg-slate-50 sm:text-sm"
            >
              View Sample Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
