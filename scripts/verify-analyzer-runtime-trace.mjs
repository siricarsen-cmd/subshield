import { builtinModules, createRequire } from "node:module";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const nodeRequire = createRequire(import.meta.url);
const repositoryRoot = resolve(".");
const nextRoot = resolve(".next");
const manifests = [];

function normalizePath(path) {
  return String(path).replaceAll("\\", "/");
}

function walk(directory, visitor) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, visitor);
    } else {
      visitor(path);
    }
  }
}

walk(nextRoot, (path) => {
  if (path.endsWith(".nft.json")) manifests.push(path);
});

const analyzerManifest = manifests.find((path) =>
  normalizePath(path).includes("/app/api/analyze-contract/route.js.nft.json"),
);

if (!analyzerManifest) {
  throw new Error("Analyzer output-file trace manifest was not generated.");
}

const parsed = JSON.parse(readFileSync(analyzerManifest, "utf8"));
if (!Array.isArray(parsed.files)) {
  throw new Error("Analyzer trace manifest does not contain a files array.");
}

const tracedFiles = parsed.files.map(normalizePath);

function nodeModulesSuffix(path) {
  const normalized = normalizePath(path);
  const marker = "/node_modules/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Expected a node_modules path, received: ${normalized}`);
  }
  return normalized.slice(markerIndex);
}

function assertTracedPath(path, label) {
  const suffix = nodeModulesSuffix(path);
  if (!tracedFiles.some((file) => file.endsWith(suffix))) {
    throw new Error(`Analyzer runtime trace is missing ${label}: ${suffix}`);
  }
}

function collectInstalledDependencyPackageJsonPaths(rootPackage) {
  const pending = [{ name: rootPackage, searchPath: repositoryRoot }];
  const visited = new Set();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    const packageJsonPath = nodeRequire.resolve(`${current.name}/package.json`, {
      paths: [current.searchPath],
    });
    if (visited.has(packageJsonPath)) continue;

    visited.add(packageJsonPath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const packageDirectory = dirname(packageJsonPath);

    for (const dependencyName of Object.keys(packageJson.dependencies ?? {})) {
      pending.push({ name: dependencyName, searchPath: packageDirectory });
    }
  }

  return visited;
}

const dependencyPackageJsonPaths =
  collectInstalledDependencyPackageJsonPaths("tesseract.js");

for (const packageJsonPath of dependencyPackageJsonPaths) {
  assertTracedPath(packageJsonPath, "Tesseract dependency package metadata");
}

const requiredWorkerPaths = [
  nodeRequire.resolve("tesseract.js/src/worker-script/node/index.js"),
  nodeRequire.resolve("tesseract.js/src/worker-script/index.js"),
  nodeRequire.resolve("@napi-rs/canvas"),
];
for (const requiredPath of requiredWorkerPaths) {
  assertTracedPath(requiredPath, "required OCR runtime file");
}

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]);
const workerSourceRoot = dirname(
  dirname(nodeRequire.resolve("tesseract.js/src/worker-script/node/index.js")),
);
const bareWorkerImports = new Set();
const requirePattern = /require\(\s*["']([^"']+)["']\s*\)/g;

walk(workerSourceRoot, (path) => {
  if (!path.endsWith(".js")) return;
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(requirePattern)) {
    const specifier = match[1];
    if (
      specifier.startsWith(".") ||
      specifier.startsWith("/") ||
      builtins.has(specifier)
    ) {
      continue;
    }
    bareWorkerImports.add(specifier);
  }
});

for (const specifier of bareWorkerImports) {
  const resolved = nodeRequire.resolve(specifier, {
    paths: [workerSourceRoot],
  });
  assertTracedPath(resolved, `worker import ${specifier}`);
}

if (!tracedFiles.some((file) =>
  file.includes("/node_modules/tesseract.js-core/") &&
  file.endsWith(".wasm.js"),
)) {
  throw new Error("Analyzer runtime trace is missing the Tesseract WASM core loaders.");
}

const tracedDependencyNames = [...dependencyPackageJsonPaths]
  .map((path) => JSON.parse(readFileSync(path, "utf8")).name)
  .filter(Boolean)
  .sort();

console.log(
  `PASS: analyzer runtime trace includes the complete ${tracedDependencyNames.length}-package ` +
  "Tesseract dependency closure, every bare Node-worker import, the WASM core loaders, and native canvas.",
);
