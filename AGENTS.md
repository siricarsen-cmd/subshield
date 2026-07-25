<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SubShield Repository Instructions

## Product purpose and user trust

SubShield is exclusively a federal government subcontract risk-review tool for small businesses and subcontractors working under federal prime contractors. It reviews prime-issued subcontract and solicitation packages from the subcontractor's perspective. It is not a federal prime-contract review platform, a Government contracting-officer tool, a general commercial-contract analyzer, or a state/local procurement analyzer.

SubShield organizes contract risks, missing information, negotiation questions, notice obligations, and attorney-preparation materials. SubShield is not a law firm and must never state or imply that a contract is safe to sign.

Client-facing analyzer accuracy is the highest priority. Prefer an honest Limited Scan or an explicit uncertainty statement over a confident but unsupported conclusion. Protect against both false positives and false negatives.

## Required development workflow

- Never work directly on `main`.
- Create a narrowly scoped branch for each task.
- Inspect the current implementation, relevant tests, and repository instructions before editing.
- Make the smallest safe change that resolves the identified root cause.
- Do not merge a pull request or deploy any environment without Carsen's explicit approval.
- Do not bypass review, required checks, or branch protections.
- Never expose, print, copy into prompts, or commit secret values.

## Analyzer evidence and accuracy rules

- Every document-specific finding must be grounded in actual text from the analyzed client document.
- Preserve exact quote verification and drop findings whose supporting text cannot be verified.
- Never invent or infer unsupported clauses, citations, dates, deadlines, dollar amounts, percentages, contract numbers, regulations, exhibits, or obligations.
- Preserve contradiction guards, finding-local guards, extraction-confidence safeguards, and false-positive protections.
- Do not suppress a true high-risk finding merely to fix a false positive. Add narrow local evidence requirements and regression coverage instead.
- Do not broaden a detector without considering unrelated language that could match.
- Do not weaken deterministic recall, grounding, deduplication, clause identity, or report ranking without explicit authorization and regression evidence.
- Limited Scan, Partial OCR, suspiciously short extraction, or otherwise unreliable extraction must never report "No Critical Flags Detected."
- Do not issue an overall signing posture when extraction quality is unreliable.
- Preserve support for PDF, DOCX, TXT, pasted text, and OCR fallback for scanned PDFs.
- Analyzer behavior changes require positive and negative regression coverage, including realistic clause variants and non-triggering language.
- When a change could affect extraction or segmentation, check that unrelated controlled findings and exact clause identities remain intact.
- When practical, verify consistent behavior across supported intake formats.

## Sensitive systems and production boundaries

Do not modify any of the following unless the current task explicitly authorizes that exact area:

- Stripe pricing, checkout, webhooks, payment mode, or live-mode configuration
- Supabase schema, migrations, RLS policies, Storage policies, or service-role operations
- Authentication, password reset, session handling, or pending-credit claims
- Credit allocation or payment/order records
- File ownership checks, report ownership, contract deletion, or Storage cleanup
- Production environment variables or secrets
- Vercel domains, deployment settings, or production releases

For destructive database, storage, payment, authentication, or production actions, stop and request explicit approval.

## Validation expectations

For code changes, run only the checks appropriate to the task and report them accurately. Analyzer changes normally require targeted positive and negative regression tests, TypeScript validation, and a production build unless the task explicitly limits execution. Documentation-only changes do not require tests.

Never claim a check passed unless it actually ran and passed. If a check is skipped, blocked, or fails because of a pre-existing issue, state that plainly.

## Completion report

Every completed engineering task must report:

- User-visible problem or requested outcome
- Root cause
- Files changed
- What behavior was preserved
- Checks performed and exact results
- Checks not performed and why
- Known limitations or unresolved risks
- Security and privacy impact
- Recommendation: ready to merge, not ready to merge, or needs targeted review
