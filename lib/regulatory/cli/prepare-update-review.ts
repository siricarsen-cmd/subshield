import { prepareStoredRegulatoryUpdateReview } from "../update-review-command";
import { parsePrepareUpdateReviewCliArguments } from "./update-review-arguments";

async function main(): Promise<void> {
  const request = parsePrepareUpdateReviewCliArguments(process.argv.slice(2));
  const result = await prepareStoredRegulatoryUpdateReview(request);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === "intake-refused") process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
