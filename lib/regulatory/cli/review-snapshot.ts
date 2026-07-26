import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { recordRegulatorySnapshotReviewDecision } from "../review-decision-command";
import { parseRegulatoryReviewDecisionCliArguments } from "./review-decision-arguments";

async function main(): Promise<void> {
  const arguments_ = parseRegulatoryReviewDecisionCliArguments(process.argv.slice(2));
  const result = await recordRegulatorySnapshotReviewDecision(arguments_);
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (arguments_.resultFile) {
    await mkdir(path.dirname(arguments_.resultFile), { recursive: true });
    await writeFile(arguments_.resultFile, serialized, {
      encoding: "utf8",
      flag: "wx",
    });
  }
  process.stdout.write(serialized);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
