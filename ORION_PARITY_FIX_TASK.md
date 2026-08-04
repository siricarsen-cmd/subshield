# Orion parity analyzer correction task

Implement and verify the owner-observed production parity fixes below. Do not merge.

## Confirmed defects

1. The report header correctly classified the fictional Orion package as `Hybrid (FFP / T&M)`, while Document Anchors displayed only `Firm-Fixed-Price (FFP)`. Preserve grounded table/label evidence so the anchor reflects both T&M and FFP instead of contradicting the classifier.
2. The `Conditioned Pre-Existing IP Retention / Unpaid Use of Improvements` analysis claimed unpaid Prime use of improvements, but the displayed quote contained only the advance identification/approval condition. Return the relevant same-numbered-clause evidence and make the analysis conditional on what its own quote states.
3. The venue finding claimed a distant litigation/arbitration forum while its displayed quote contained only Virginia governing law. Include the same-clause Arlington County/forum sentence when present, use finding-local analysis, and prevent unsupported forum claims.
4. Detect the material clause: `Failure to submit a complete invoice within 30 calendar days ... waives Subcontractor's right to payment`. Add a narrowly gated deterministic `Invoice Submission Deadline / Payment Waiver` finding. An ordinary invoice deadline without express waiver/forfeiture must not trigger.
5. Tighten the `Missing / Deferred Contract Documents` evidence quote to the Attachment List range instead of including Government Interaction, labor rates, and quote-submission sections.

## Required regression coverage

Add an Orion-specific fixture/test that runs paragraph and whitespace-flattened representations and proves:

- anchor preserves T&M plus FFP evidence;
- classifier remains Hybrid;
- invoice waiver is detected and grounded;
- IP quote/analysis includes only supported facts;
- venue quote/analysis includes the Arlington forum when present and never invents a forum from governing law alone;
- missing-document quote is bounded to the Attachment List;
- every final finding survives exact-quote and finding-local verification;
- ordinary invoice deadlines, governing-law-only text, and conditioned-IP-only text remain safe negative controls.

Run `npm run test:accuracy`, `npx tsc --noEmit`, and `npm run build`. Keep changes limited to analyzer logic/tests and the test script chain. Remove this task file and the one-time workflow before the final review. Request a fresh Codex review of the exact final head and wait for it before merge.