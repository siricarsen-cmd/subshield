// Focused, deterministic SEO configuration checks. This test does not call
// production services or require environment variables.
//
// Run with:
// node --experimental-strip-types lib/__tests__/seo-foundation.test.mjs
import {
  DEFAULT_TITLE,
  SITE_ORIGIN,
  privateRoutes,
  publicRoutes,
  siteUrl,
} from "../seo.ts";

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

const paths = publicRoutes.map(({ path }) => path);
const urls = publicRoutes.map(({ path }) => siteUrl(path));
const serializedConfig = JSON.stringify({ publicRoutes, privateRoutes, urls });
const requiredStaticPaths = [
  "/",
  "/pricing",
  "/sample-report",
  "/about",
  "/blog",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
];
const forbiddenPathPatterns = [
  /^\/api(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/report(?:\/|$)/,
  /^\/(?:forgot|reset)-password(?:\/|$)/,
  /^\/success(?:\/|$)/,
  /^\/intake(?:\/|$)/,
];

check("canonical origin is the fixed HTTPS www production domain", SITE_ORIGIN === "https://www.subshield.net");
check("homepage uses the approved default title", publicRoutes[0]?.title === DEFAULT_TITLE);
check("all 25 verified public page routes are represented", publicRoutes.length === 25);
check("public route paths are unique", new Set(paths).size === paths.length);
check("generated sitemap URLs are unique", new Set(urls).size === urls.length);
check("public titles are unique", new Set(publicRoutes.map(({ title }) => title)).size === publicRoutes.length);
check(
  "public descriptions are unique and non-empty",
  new Set(publicRoutes.map(({ description }) => description)).size === publicRoutes.length &&
    publicRoutes.every(({ description }) => description.trim().length > 0),
);
check(
  "every required static public route is present",
  requiredStaticPaths.every((path) => paths.includes(path)),
);
check(
  "all 16 verified blog articles are present",
  paths.filter((path) => path.startsWith("/blog/")).length === 16,
);
check(
  "sitemap paths contain no private, authenticated, transactional, or API routes",
  paths.every((path) => forbiddenPathPatterns.every((pattern) => !pattern.test(path))),
);
check(
  "all sitemap URLs use the production origin without query strings",
  urls.every(
    (url) => (url === SITE_ORIGIN || url.startsWith(`${SITE_ORIGIN}/`)) && !url.includes("?"),
  ),
);
check(
  "configuration contains no localhost, preview, old Vercel, or dynamic report identifiers",
  !/localhost|vercel\.app|\[id\]|\/report\//i.test(JSON.stringify({ publicRoutes, urls })),
);
check(
  "all seven private route families are explicitly inventoried",
  privateRoutes.length === 7 && privateRoutes.includes("/report/[id]"),
);
check(
  "SEO configuration contains no secret, email, or customer-data fields",
  !/supabase|stripe|resend|api[_-]?key|@|filename|customer/i.test(serializedConfig),
);

if (failures > 0) process.exit(1);
console.log("\nAll SEO foundation checks passed.");
