import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const nextRoot = resolve(".next");
const manifests = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
    } else if (entry.endsWith(".nft.json")) {
      manifests.push(path);
    }
  }
}

walk(nextRoot);

const analyzerManifest = manifests.find((path) =>
  path.replaceAll("\\", "/").includes("/app/api/analyze-contract/route.js.nft.json"),
);

if (!analyzerManifest) {
  throw new Error("Analyzer output-file trace manifest was not generated.");
}

const parsed = JSON.parse(readFileSync(analyzerManifest, "utf8"));
if (!Array.isArray(parsed.files)) {
  throw new Error("Analyzer trace manifest does not contain a files array.");
}

const files = parsed.files.map((file) => String(file).replaceAll("\\", "/"));
const requiredSuffixes = [
  "/node_modules/tesseract.js/src/worker-script/node/index.js",
  "/node_modules/tesseract.js/src/worker-script/index.js",
  "/node_modules/@napi-rs/canvas/index.js",
];

for (const suffix of requiredSuffixes) {
  if (!files.some((file) => file.endsWith(suffix))) {
    throw new Error(`Analyzer runtime trace is missing required file: ${suffix}`);
  }
}

if (!files.some((file) =>
  file.includes("/node_modules/tesseract.js-core/") && file.endsWith(".wasm.js"),
)) {
  throw new Error("Analyzer runtime trace is missing the Tesseract WASM core loaders.");
}

console.log("PASS: analyzer runtime trace includes Tesseract worker, parent module, core loaders, and native canvas entrypoint.");
