# SubPreCheck Domain Foundation — Pre-Cutover Runbook

Status: PRE-CUTOVER READY. This runbook does not authorize the public cutover.

## Verified domain state

- `https://www.subprecheck.com` is attached to the existing Vercel `subshield` project and serves Production.
- `https://subprecheck.com` permanently redirects to `https://www.subprecheck.com` with the requested path preserved.
- HTTPS and HSTS are operational on the new apex and `www` hostnames.
- `https://www.subprecheck.com/api/health` returns `{ "status": "ok" }`.
- `https://www.subshield.net/api/health` returns `{ "status": "ok" }`.
- `https://www.subshield.net` remains the current canonical production site.
- `https://subshield.net` continues to redirect to `https://www.subshield.net` with the requested path preserved.
- Before cutover, the SubPreCheck hostname continues to emit SubShield canonical metadata, robots host/sitemap values, and SubShield sitemap URLs.

Post-merge production verification on 2026-08-19 confirmed these conditions after PR #118 deployed to Production.

## Canonical decision

The intended SubPreCheck canonical host is:

`https://www.subprecheck.com`

The intended alternate-host behavior is:

`https://subprecheck.com/<path>` -> permanent redirect -> `https://www.subprecheck.com/<path>`

## Approved production-origin compatibility — COMPLETE

PR #118 (`Prepare approved SubPreCheck production origin compatibility`) was merged before public cutover.

The application now recognizes exactly two approved production origins:

- current: `https://www.subshield.net`
- future: `https://www.subprecheck.com`

The compatibility layer:

- keeps production health fail-closed for any other origin;
- requires an approved HTTPS production origin without embedded credentials;
- resolves SEO canonical/sitemap/robots origin from the approved `NEXT_PUBLIC_BASE_URL`;
- preserves the current SubShield canonical while Vercel `NEXT_PUBLIC_BASE_URL` remains on SubShield;
- is already tested for both approved origins.

This removes the need for an emergency SEO/health code edit at cutover. The actual public canonical switch will occur only when Vercel Production `NEXT_PUBLIC_BASE_URL` is deliberately changed to `https://www.subprecheck.com` as part of the coordinated rebrand release.

Visible branding remains SubShield until the separate rebrand work is ready.

## Current cutover dependencies

The remaining external/runtime dependencies that still select the current SubShield production identity are:

1. Vercel Production `NEXT_PUBLIC_BASE_URL`.
2. Supabase Site URL.
3. Stripe live webhook endpoint.
4. Stripe Billing Portal return URL.
5. Production CI/smoke-test URLs that explicitly target the live canonical host.
6. Vercel legacy-domain redirect configuration after the new site is verified.
7. Search Console migration/submission after canonical ownership and redirects are live.
8. Final visible SubPreCheck branding/copy/assets from the separate rebrand workstream.

These items must not be switched independently in a way that creates a partially migrated public site.

## Safe pre-configuration completed

The following pre-cutover actions are complete:

- Both SubPreCheck hostnames are connected to the existing Vercel project.
- DNS, HTTPS, HSTS, application availability, and `/api/health` were verified on the new hostname.
- `subprecheck.com` redirects permanently to `www.subprecheck.com` and preserves paths.
- Exact SubPreCheck authentication callback destinations were added to Supabase Redirect URLs while retaining existing SubShield, localhost, and Vercel entries.
- Supabase Site URL remains `https://www.subshield.net`.
- Stripe webhook and Billing Portal URLs were inventoried and intentionally left unchanged.
- All SubShield domains and certificates remain in service.
- Vercel `NEXT_PUBLIC_BASE_URL` remains on the current SubShield origin.
- A live automated pre-cutover guard is present in GitHub and has passed.
- PR #118 merged the approved SubShield/SubPreCheck production-origin compatibility layer.
- Post-merge Production verification confirmed that SubPreCheck still advertises SubShield as canonical and both health endpoints remain healthy.
- Post-merge `robots.txt` and `sitemap.xml` on `www.subprecheck.com` still advertise SubShield URLs.
- Post-merge path checks confirmed both apex-domain redirects preserve an existing blog path.

## Supabase Auth URL Configuration — pre-cutover gate COMPLETE

Verified on 2026-08-19 in Supabase Authentication -> URL Configuration:

- Site URL remains `https://www.subshield.net`.
- Existing SubShield, localhost, and Vercel redirect entries remain present.
- These four SubPreCheck Redirect URLs are present:
  - `https://www.subprecheck.com/reset-password`
  - `https://www.subprecheck.com/dashboard`
  - `https://subprecheck.com/reset-password`
  - `https://subprecheck.com/dashboard`

At coordinated cutover, change the Supabase Site URL to `https://www.subprecheck.com` only after the final SubPreCheck production release is ready. Do not remove the SubShield Redirect URLs during the initial migration window.

## Human-only provider gate: Vercel production environment variable

The connected Vercel API available to the migration operator does not expose project environment-variable writes. `NEXT_PUBLIC_BASE_URL` must remain on the current SubShield origin during pre-configuration.

At coordinated cutover it must become:

`https://www.subprecheck.com`

Because PR #118 is already merged, this approved environment-variable change will select the SubPreCheck runtime/SEO origin through the tested compatibility layer. Do not make the change before the final branding release and external provider changes are ready to be coordinated.

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

After the final SubPreCheck release, new canonical origin, auth, and billing configuration are fully verified, preserve paths when redirecting the old domain:

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

These items are intentionally not complete and must be coordinated during the public rebrand release:

1. Finish and validate the visible SubPreCheck branding/copy/assets release. Do not publish a new-domain canonical while the production UI still presents the old brand unless the Command Center explicitly chooses that sequence.
2. Update any production CI/smoke-test host assumptions needed for the new canonical release.
3. Change Vercel Production `NEXT_PUBLIC_BASE_URL` to `https://www.subprecheck.com` and allow the resulting Production deployment to finish.
4. Immediately verify SubPreCheck canonical metadata, robots, sitemap, `/api/health`, public routes, and security headers on that exact deployment.
5. Change Supabase Site URL to `https://www.subprecheck.com` while retaining the old redirect allowlist entries.
6. Verify login, password reset, magic link, dashboard access, and authenticated report flows on SubPreCheck.
7. Update the existing Stripe webhook endpoint to the new canonical host and verify signed delivery.
8. Update the Stripe Billing Portal return URL to the new canonical dashboard and verify checkout success/cancel and portal-return behavior.
9. Only after the new site, auth, and billing paths are healthy, configure path-preserving permanent redirects from the old SubShield domain.
10. Verify representative old static paths and every important indexed/blog path redirect to the matching SubPreCheck path.
11. Complete Search Console/domain-migration work after the redirects and SubPreCheck canonical site are live.
12. Keep both SubShield domains and certificates active for the migration/redirect period; do not allow them to expire.

## Public cutover is explicitly out of scope for this foundation work

Do not, as part of pre-cutover foundation work:

- change Vercel Production `NEXT_PUBLIC_BASE_URL` to SubPreCheck;
- change Supabase Site URL;
- remove SubShield auth Redirect URLs;
- update the Stripe webhook;
- update the Stripe Billing Portal return URL;
- redirect `www.subshield.net` to SubPreCheck;
- submit the new sitemap to Search Console;
- remove either SubShield domain from Vercel;
- allow `subshield.net` to expire.

The coordinated cutover must be treated as a separate operation with immediate verification and a rollback path. The merged compatibility layer prepares the code for that event but does not itself authorize or perform the cutover.
