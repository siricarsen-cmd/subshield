import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const vercelConfigPath = path.join(repoRoot, "vercel.json");
const analyzerRoutePath = path.join(
  repoRoot,
  "app",
  "api",
  "analyze-contract",
  "route.ts",
);

function fail(message) {
  console.error(`Vercel runtime policy check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(vercelConfigPath)) {
  fail("vercel.json is missing.");
}

let vercelConfig;
try {
  vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));
} catch (error) {
  fail(`vercel.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

if (vercelConfig.fluid !== true) {
  fail("Fluid Compute must be explicitly enabled with fluid=true.");
}

if (!fs.existsSync(analyzerRoutePath)) {
  fail("the active analyzer route is missing.");
}

const analyzerRoute = fs.readFileSync(analyzerRoutePath, "utf8");
if (!/export\s+const\s+runtime\s*=\s*['"]nodejs['"]\s*;/.test(analyzerRoute)) {
  fail("the analyzer route must use the Node.js runtime.");
}

const durationMatch = analyzerRoute.match(
  /export\s+const\s+maxDuration\s*=\s*(\d+)\s*;/,
);
if (!durationMatch) {
  fail("the analyzer route must declare maxDuration.");
}

if (Number(durationMatch[1]) !== 60) {
  fail(`the analyzer route maxDuration must remain 60 seconds, found ${durationMatch[1]}.`);
}

console.log("Vercel Fluid Compute and analyzer duration policy passed.");
