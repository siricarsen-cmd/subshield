# SubPreCheck Domain Foundation — Pre-Cutover Runbook

Status: PRE-CUTOVER READY. This runbook does not authorize the public cutover.

## Verified domain state

- `https://www.subprecheck.com` is attached to the existing Vercel `subshield` project and serves Production.
- `https://subprecheck.com` permanently redirects to `https://www.subprecheck.com`.
- HTTPS is operational on the new apex and `www` hostnames.
- `https://www.subprecheck.com/api/health` returns `{ "status": "ok" }`.
- `https://www.subshield.net` remains the current canonical production site.
- `https://subshield.net` continues to redirect to `https://www.subshield.net`.
- Before cutover, the SubPreCheck hostname must continue to emit SubShield canonical metadata, robots host/sitemap values, and SubShield sitemap URLs.

## Canonical decision

The intended SubPreCheck canonical host is:

`https://www.subprecheck.com`

The intended alternate-host behavior is:

`https://subprecheck.com/<path>` -> permanent redirect -> `https://www.subprecheck.com/<path>`

## Current cutover dependencies

The production application currently depends on `https://www.subshield.net` in these active areas:

1. SEO canonical origin (`lib/seo.ts`).
2. Production health origin (`lib/production-health.ts`).
3. Vercel `NEXT_PUBLIC_BASE_URL`.
4. Stripe checkout success/cancel URLs generated from the application base URL.
5. Supabase Site URL.
6. Stripe live webhook endpoint.
7. Stripe Billing Portal return URL.
8. Production CI/smoke-test assumptions.

These items must not be switched independently.

## Safe pre-configuration completed

The following pre-cutover actions are complete:

- Both SubPreCheck hostnames are connected to the existing Vercel project.
- DNS, HTTPS, HSTS, application availability, and `/api/health` were verified on the new hostname.
- `subprecheck.com` redirects permanently to `www.subprecheck.com`.
- Exact SubPreCheck authentication callback destinations were added to Supabase Redirect URLs while retaining existing SubShield, localhost, and Vercel entries.
- Supabase Site URL remains `https://www.subshield.net`.
- Stripe webhook and Billing Portal URLs were inventoried and intentionally left unchanged.
- All SubShield domains and certificates remain in service.
- Vercel `NEXT_PUBLIC_BASE_URL` remains on the current SubShield origin.
- A live automated pre-cutover guard is present in GitHub and has passed.

## Supabase Auth URL Configuration — pre-cutover gate COMPLETE

Verified on 2026-08-19 in Supabase Authentication -> URL Configuration:

- Site URL remains `https://www.subshield.net`.
- Existing SubShield, localhost, and Vercel redirect entries remain present.
- These four SubPreCheck Redirect URLs are present:
  - `https://www.subprecheck.com/reset-password`
  - `https://www.subprecheck.com/dashboard`
  - `https://subprecheck.com/reset-password`
  - `https://subprecheck.com/dashboard`

At coordinated cutover, change the Supabase Site URL to `https://www.subprecheck.com` only after the new production application configuration is ready. Do not remove the SubShield Redirect URLs during the initial migration window.

## Human-only provider gate: Vercel production environment variable

The connected Vercel API available to the migration operator does not expose project environment-variable writes. `NEXT_PUBLIC_BASE_URL` must remain on the current SubShield origin during pre-configuration. At the coordinated cutover it must become:

`https://www.subprecheck.com`

Do not change it early because checkout/auth return URLs and the production health gate depend on it.

## Stripe cutover requirements

Do not change Stripe during pre-configuration.

Current live Stripe state verified before cutover:

- webhook endpoint: `https://www.subshield.net/api/webhooks/stripe`
- enabled events: `checkout.session.completed`, `invoice.paid`
- Billing Portal default return URL: `https://www.subshield.net/dashboard`

At coordinated cutover:

- update the existing live webhook endpoint to `https://www.subprecheck.com/api/webhooks/stripe`;
- verify webhook delivery/signature handling after the change;
- update the Billing Portal default return URL to `https://www.subprecheck.com/dashboard`;
- verify checkout success/cancel URLs resolve to the SubPreCheck canonical origin.

The old SubShield domains must remain operational during and after this transition.

## Legacy-domain redirect requirement after cutover

After the new canonical origin is fully configured and verified, preserve paths when redirecting the old domain:

- `https://www.subshield.net/<path>` -> permanent redirect -> `https://www.subprecheck.com/<path>`
- `https://subshield.net/<path>` -> permanent redirect -> `https://www.subprecheck.com/<path>`

Do not collapse all old URLs to the new homepage. Existing public route slugs, including all blog slugs, should remain unchanged.

## Pre-cutover automated guard

Run:

`node scripts/verify-subprecheck-domain-foundation.mjs`

Before cutover the guard requires:

- new `www` returns 200 over HTTPS;
- new apex returns 308 to new `www`;
- new and old health endpoints remain `ok`;
- new hostname has HSTS;
- current SubShield apex still redirects to current SubShield `www`;
- SubPreCheck-hosted HTML still declares the SubShield canonical;
- robots and sitemap still advertise SubShield URLs.

A passing result means the new domain foundation is ready while public canonical ownership remains unchanged.

## Remaining coordinated-cutover gates

These items are intentionally not complete and must move together during the public cutover:

1. Merge the final rebrand/domain code that changes the canonical SEO origin and production-health origin to `https://www.subprecheck.com` and updates domain-dependent tests/CI.
2. Change Vercel Production `NEXT_PUBLIC_BASE_URL` to `https://www.subprecheck.com`.
3. Change Supabase Site URL to `https://www.subprecheck.com` while retaining the old redirect allowlist entries.
4. Update the existing Stripe webhook endpoint to the new canonical host and verify delivery.
5. Update the Stripe Billing Portal return URL to the new canonical dashboard.
6. Verify login, password reset, magic link, checkout success/cancel, dashboard access, analyzer/report flows, sitemap, robots, and canonical metadata on SubPreCheck.
7. Only after the new site is healthy, configure path-preserving permanent redirects from the old SubShield domain.
8. Verify old paths and blog URLs redirect to the matching SubPreCheck paths.
9. Complete Search Console/domain-migration work after the redirects and canonical site are live.

## Public cutover is explicitly out of scope for this foundation work

Do not, as part of this pre-cutover foundation work:

- change `NEXT_PUBLIC_BASE_URL`;
- change `SITE_ORIGIN` on `main`;
- change the production health origin on `main`;
- change Supabase Site URL;
- remove SubShield auth Redirect URLs;
- update the Stripe webhook;
- update the Stripe Billing Portal return URL;
- redirect `www.subshield.net` to SubPreCheck;
- submit the new sitemap to Search Console;
- remove either SubShield domain from Vercel;
- allow `subshield.net` to expire.

The coordinated cutover must be treated as a separate, explicitly authorized operation with immediate verification and a rollback path.
