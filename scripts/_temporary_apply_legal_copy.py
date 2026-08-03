from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(
            f"{path}: expected {expected} occurrence(s), found {count}: {old!r}"
        )
    file.write_text(text.replace(old, new))


replace("app/page.tsx", "256-Bit Encrypted Portal", "Secure HTTPS Connection")

replace(
    "app/pricing/page.tsx",
    '      a: "One credit covers one submitted document analysis. The Single Review Cycle is a one-time purchase for 1 credit. Active Bidder is a $249 monthly subscription that adds 3 credits for each successfully paid eligible monthly billing cycle, and unused credits remain available in your account. The Enterprise Credit Pack is a $1,999 one-time purchase for 30 credits.",',
    '      a: "One credit covers one submitted document analysis. The Single Review Cycle is a one-time purchase for 1 credit. Active Bidder is a $249 monthly subscription that adds 3 credits for each successfully paid eligible monthly billing cycle, and unused credits remain available in your account. The Enterprise Credit Pack is a $1,999 one-time purchase for 30 credits. The Stripe billing portal supports payment-method updates, invoice history, and scheduling Active Bidder cancellation at the end of the current billing period.",',
)
replace(
    "app/pricing/page.tsx",
    '                  "Manage Or Cancel Through The Stripe Billing Portal",',
    '                  "Update Payment Method, View Invoices, Or Schedule Period-End Cancellation",',
)

replace(
    "app/faq/page.tsx",
    '      a: "Each plan provides the review credits described on the Pricing page. An available credit is required to run a document review. Revised documents or additional packages may require another credit, depending on the review being submitted. Current plan details are always shown on the Pricing page."',
    '      a: "One available credit is required for each submitted document analysis. The Single Review Cycle provides 1 credit for $149.99 one time, the Active Bidder Plan provides 3 credits for each successfully paid eligible $249 monthly billing cycle, and the Enterprise Credit Pack provides 30 credits for $1,999 one time. Unused credits remain available in the customer account. A revised or amended document always requires another available credit and a new analysis; SubShield does not provide automated version comparison. Active Bidder customers can use the Stripe billing portal to update a payment method, view invoice history, or schedule cancellation at the end of the current billing period."',
)
replace(
    "app/faq/page.tsx",
    '      a: "Documents and reports are associated with the signed-in account and are processed to provide the SubShield service. Users can delete saved reviews from the dashboard. When an associated contract file is stored with the review, the deletion workflow also removes that stored file. Additional details are provided in the Privacy Policy."',
    '      a: "Documents and reports are associated with the signed-in account and are processed to provide the SubShield service. Users can delete saved reviews from the dashboard. When an associated contract file is stored with the review, the deletion workflow also removes that stored file. Limited billing, accounting, fulfillment, security, transaction, and diagnostic records may remain as described in the Privacy Policy."',
)

replace(
    "app/terms/page.tsx",
    '<p>A $249 monthly subscription provides 3 review credits for each successfully paid eligible monthly billing cycle. Unused credits remain available in the customer account. Customers can manage or cancel the subscription through the Stripe billing portal.</p>',
    '<p>A $249 monthly subscription provides 3 review credits for each successfully paid eligible monthly billing cycle. Unused credits remain available in the customer account. Customers can update their payment method, view invoice history, and schedule cancellation at the end of the current billing period through the Stripe billing portal.</p>',
)

replace(
    "app/privacy/page.tsx",
    '            SubShield relies on service providers for website hosting, authentication, database and file storage, payment processing, email delivery, and AI-assisted analysis. These providers handle information as needed to deliver their services. Stripe processes payments and billing-portal access. Resend processes Contact-form messages for delivery to SubShield. This Policy does not claim certifications, government authorizations, or contractual protections that have not been verified.',
    '            SubShield currently relies on Vercel for application hosting and runtime services; Supabase for authentication, database, and file storage; Stripe for payment processing and billing-portal access; Resend for Contact-form delivery; and OpenAI for AI-assisted analysis of submitted text and extracted document content. These providers handle information as needed to deliver their services. This Policy does not claim certifications, government authorizations, or contractual protections that have not been verified.',
)

replace(
    "lib/contact-form.ts",
    '  { value: "pricing-and-credits", label: "Pricing and Credits" },\n',
    '  { value: "pricing-and-credits", label: "Pricing and Credits" },\n'
    '  { value: "billing-or-refund", label: "Billing or Refund Request" },\n',
)
replace(
    "app/contact/page.tsx",
    "You have questions about pricing, plans, or review credits",
    "You have questions about billing, refunds, plans, or review credits",
)
replace(
    "app/contact/page.tsx",
    "features, supported document intake, privacy, and credit billing.",
    "features, supported document intake, privacy, billing, and refund requests.",
)

replace(
    "lib/__tests__/public-ux-consistency.test.mjs",
    'const about = readSource("app/about/page.tsx");\n',
    'const about = readSource("app/about/page.tsx");\n'
    'const home = readSource("app/page.tsx");\n'
    'const pricing = readSource("app/pricing/page.tsx");\n'
    'const terms = readSource("app/terms/page.tsx");\n'
    'const privacy = readSource("app/privacy/page.tsx");\n'
    'const contact = readSource("app/contact/page.tsx");\n'
    'const contactForm = readSource("lib/contact-form.ts");\n',
)

audit_checks = r'''
check(
  "Homepage uses a verified HTTPS trust claim",
  home.includes("Secure HTTPS Connection") &&
    !home.includes("256-Bit Encrypted Portal"),
);
check(
  "Pricing and Terms use the canonical prices and credit quantities",
  pricing.includes("$149.99") &&
    pricing.includes("$249") &&
    pricing.includes("$1,999") &&
    pricing.includes("1 Review Credit") &&
    pricing.includes("3 Review Credits Per Successfully Paid Monthly Billing Cycle") &&
    pricing.includes("30 Review Credits") &&
    terms.includes("A $149.99 one-time purchase provides 1 review credit") &&
    terms.includes("A $249 monthly subscription provides 3 review credits") &&
    terms.includes("A $1,999 one-time purchase provides 30 review credits"),
);
check(
  "Customer copy states the exact revised-document credit rule",
  faq.includes("A revised or amended document always requires another available credit and a new analysis") &&
    pricing.includes("A revised or amended document requires another available credit and a new analysis") &&
    terms.includes("A revised or amended document requires another available credit and a new analysis") &&
    !faq.includes("may require another credit"),
);
check(
  "Billing copy states portal capabilities and period-end cancellation",
  pricing.includes("Update Payment Method, View Invoices, Or Schedule Period-End Cancellation") &&
    pricing.includes("scheduling Active Bidder cancellation at the end of the current billing period") &&
    faq.includes("schedule cancellation at the end of the current billing period") &&
    terms.includes("schedule cancellation at the end of the current billing period"),
);
check(
  "Deletion copy does not promise removal of required limited records",
  faq.includes("Limited billing, accounting, fulfillment, security, transaction, and diagnostic records may remain") &&
    privacy.includes("Limited accounting, transaction, credit-fulfillment, security, and diagnostic records may remain after deletion") &&
    terms.includes("Limited billing, accounting, fulfillment, security, transaction, and diagnostic records may remain"),
);
check(
  "Privacy Policy names the current service-provider roles",
  ["Vercel", "Supabase", "Stripe", "Resend", "OpenAI"].every((provider) =>
    privacy.includes(provider),
  ),
);
check(
  "Contact flow provides a clear billing and refund-request path",
  contact.includes("billing, refunds, plans, or review credits") &&
    contact.includes("billing, and refund requests") &&
    contactForm.includes('{ value: "billing-or-refund", label: "Billing or Refund Request" }'),
);
'''
replace(
    "lib/__tests__/public-ux-consistency.test.mjs",
    "const titleLinkPattern =\n",
    audit_checks + "\nconst titleLinkPattern =\n",
)
