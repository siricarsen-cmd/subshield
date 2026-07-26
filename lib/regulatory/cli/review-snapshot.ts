import { recordRegulatorySnapshotReviewDecision } from "../review-decision-command";
import { parseRegulatoryReviewDecisionCliArguments } from "./review-decision-arguments";
import {
  reserveRegulatoryReviewResultFile,
  type RegulatoryReviewResultFileReservation,
} from "./review-result-file";

async function main(): Promise<void> {
  const arguments_ = parseRegulatoryReviewDecisionCliArguments(process.argv.slice(2));
  let reservation: RegulatoryReviewResultFileReservation | undefined;
  if (arguments_.resultFile) {
    reservation = await reserveRegulatoryReviewResultFile(arguments_.resultFile);
  }

  let result;
  try {
    result = await recordRegulatorySnapshotReviewDecision(arguments_);
  } catch (error) {
    await reservation?.abandon();
    throw error;
  }

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (reservation) {
    try {
      await reservation.finalize(serialized);
    } catch (error) {
      process.stdout.write(serialized);
      throw new Error(
        `Regulatory review decision was persisted, but the reserved result file could not be finalized: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  process.stdout.write(serialized);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
