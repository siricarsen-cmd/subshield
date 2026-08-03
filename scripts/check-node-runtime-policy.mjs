import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

assert.equal(read(".nvmrc").trim(), "24", ".nvmrc must select Node 24");

const packageJson = JSON.parse(read("package.json"));
assert.equal(packageJson.engines?.node, ">=22 <25", "package.json must support Node >=22 <25");

const packageLock = JSON.parse(read("package-lock.json"));
assert.equal(packageLock.packages?.[""]?.engines?.node, ">=22 <25", "package-lock root engines must match package.json");

const workflowDirectory = path.join(root, ".github", "workflows");
const compatibilityName = "node-runtime-compatibility.yml";
let primaryRuntimeWorkflows = 0;
let compatibilityWorkflows = 0;

for (const name of fs.readdirSync(workflowDirectory).filter((entry) => entry.endsWith(".yml"))) {
  if (name.startsWith("node-runtime-policy-")) continue;
  const text = fs.readFileSync(path.join(workflowDirectory, name), "utf8");
  if (!text.includes("actions/setup-node@")) continue;

  if (name === compatibilityName) {
    assert.match(text, /node-version:\s*22\b/, "compatibility workflow must use Node 22");
    assert.doesNotMatch(text, /node-version:\s*24\b/, "compatibility workflow must remain Node 22 only");
    compatibilityWorkflows += 1;
    continue;
  }

  assert.doesNotMatch(text, /node-version:\s*22\b/, `${name} must not use Node 22 as a primary runtime`);
  assert.match(text, /node-version:\s*24\b/, `${name} must use Node 24`);
  primaryRuntimeWorkflows += 1;
}

assert.equal(compatibilityWorkflows, 1, "exactly one Node 22 compatibility workflow is required");
assert.ok(primaryRuntimeWorkflows >= 6, "expected all established primary workflows to use Node 24");
console.log(`Runtime policy valid: ${primaryRuntimeWorkflows} primary Node 24 workflows and one Node 22 compatibility lane.`);
