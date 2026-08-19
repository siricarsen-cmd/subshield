const OLD_CANONICAL = "https://www.subshield.net";
const OLD_APEX = "https://subshield.net";
const NEW_CANONICAL = "https://www.subprecheck.com";
const NEW_APEX = "https://subprecheck.com";

let failures = 0;

function pass(label) {
  console.log(`PASS: ${label}`);
}

function fail(label, details = "") {
  console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  failures += 1;
}

function check(label, condition, details = "") {
  if (condition) pass(label);
  else fail(label, details);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "SubShield-SubPreCheck-Domain-Foundation-Check/1.0",
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function expectStatus(url, expectedStatus, options = {}) {
  try {
    const response = await fetchWithTimeout(url, options);
    check(
      `${url} returns ${expectedStatus}`,
      response.status === expectedStatus,
      `received ${response.status}`,
    );
    return response;
  } catch (error) {
    fail(`${url} is reachable`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

const newWwwHome = await expectStatus(`${NEW_CANONICAL}/`, 200);
if (newWwwHome) {
  const html = await newWwwHome.text();
  check(
    "new www hostname serves the current production application",
    /<title>Government Subcontract Risk Review \| SubShield<\/title>/i.test(html),
  );
  check(
    "pre-cutover canonical remains on www.subshield.net",
    html.includes(`<link rel="canonical" href="${OLD_CANONICAL}"`),
  );
  check(
    "pre-cutover homepage does not claim www.subprecheck.com as canonical",
    !html.includes(`<link rel="canonical" href="${NEW_CANONICAL}"`),
  );
  check(
    "new www hostname has HSTS enabled",
    (newWwwHome.headers.get("strict-transport-security") ?? "").includes("max-age="),
  );
}

const newHealth = await expectStatus(`${NEW_CANONICAL}/api/health`, 200);
if (newHealth) {
  let payload;
  try {
    payload = await newHealth.json();
  } catch {
    payload = null;
  }
  check(
    "new www hostname health response is exactly ok",
    JSON.stringify(payload) === JSON.stringify({ status: "ok" }),
    JSON.stringify(payload),
  );
}

const oldHealth = await expectStatus(`${OLD_CANONICAL}/api/health`, 200);
if (oldHealth) {
  let payload;
  try {
    payload = await oldHealth.json();
  } catch {
    payload = null;
  }
  check(
    "existing SubShield health remains ok",
    JSON.stringify(payload) === JSON.stringify({ status: "ok" }),
    JSON.stringify(payload),
  );
}

const newApex = await expectStatus(`${NEW_APEX}/`, 308, { redirect: "manual" });
if (newApex) {
  check(
    "new apex redirects to new www canonical host",
    newApex.headers.get("location") === `${NEW_CANONICAL}/`,
    `location=${newApex.headers.get("location")}`,
  );
}

const oldApex = await expectStatus(`${OLD_APEX}/`, 308, { redirect: "manual" });
if (oldApex) {
  check(
    "existing SubShield apex still redirects to existing SubShield www host",
    oldApex.headers.get("location") === `${OLD_CANONICAL}/`,
    `location=${oldApex.headers.get("location")}`,
  );
}

const robots = await expectStatus(`${NEW_CANONICAL}/robots.txt`, 200);
if (robots) {
  const text = await robots.text();
  check(
    "pre-cutover robots Host remains www.subshield.net",
    text.includes(`Host: ${OLD_CANONICAL}`),
  );
  check(
    "pre-cutover robots sitemap remains on www.subshield.net",
    text.includes(`Sitemap: ${OLD_CANONICAL}/sitemap.xml`),
  );
  check(
    "pre-cutover robots does not advertise the new canonical domain",
    !text.includes(`Host: ${NEW_CANONICAL}`) && !text.includes(`Sitemap: ${NEW_CANONICAL}/sitemap.xml`),
  );
}

const sitemap = await expectStatus(`${NEW_CANONICAL}/sitemap.xml`, 200);
if (sitemap) {
  const xml = await sitemap.text();
  check(
    "pre-cutover sitemap still emits SubShield canonical URLs",
    xml.includes(`<loc>${OLD_CANONICAL}</loc>`) && xml.includes(`${OLD_CANONICAL}/blog/`),
  );
  check(
    "pre-cutover sitemap does not emit SubPreCheck canonical URLs",
    !xml.includes(`<loc>${NEW_CANONICAL}`),
  );
}

if (failures > 0) {
  console.error(`\nSubPreCheck domain foundation check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("\nSubPreCheck domain foundation is healthy and the public cutover has not occurred.");
