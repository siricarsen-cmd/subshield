// Anchor grounding regressions for Fixture A price/funding/sector evidence.
import { extractAnchorCandidates } from "../anchors.ts";
import { classifyContract } from "../classify.ts";
import {
  ANCHOR_FIXTURE,
  LONG_PROFESSIONAL_SECTOR_SENTENCE,
} from "../__fixtures__/fixture-a-rc-clauses.mjs";

let failures = 0;
function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failures++;
  }
}

const anchors = extractAnchorCandidates(ANCHOR_FIXTURE);
check("J1. Ceiling Amount populates price/estimated value with $850,000", anchors.priceOrEstimatedValue === "$850,000");
check("J2. nonnumeric funding-limit statement is omitted", anchors.fundingLimit === undefined);
check("J3. fundingLimit never returns the label fragment 'funding limit.'", anchors.fundingLimit !== "funding limit.");
check("J4. returned price value is a literal document substring", Boolean(anchors.priceOrEstimatedValue && ANCHOR_FIXTURE.includes(anchors.priceOrEstimatedValue)));

const aggregateOnly = "The maximum aggregate value of this Subcontract shall not exceed $850,000.";
check("J5. maximum aggregate value also populates price anchor", extractAnchorCandidates(aggregateOnly).priceOrEstimatedValue === "$850,000");

const numericFunding = "Funding Limit: $275,000";
const numericFundingAnchor = extractAnchorCandidates(numericFunding).fundingLimit;
check("J6. a defensible numerical funding limit still populates the anchor", numericFundingAnchor === "$275,000");
check("J7. returned funding amount is a literal source substring", Boolean(numericFundingAnchor && numericFunding.includes(numericFundingAnchor)));

const sectorEvidence = classifyContract(LONG_PROFESSIONAL_SECTOR_SENTENCE).sectorEvidence;
const evidenceIndex = sectorEvidence ? LONG_PROFESSIONAL_SECTOR_SENTENCE.indexOf(sectorEvidence) : -1;
check("J8. professional-services sector evidence is present", Boolean(sectorEvidence));
check("J9. sector evidence is a literal source substring", evidenceIndex >= 0);
check("J10. sector evidence starts at a word/clause boundary", evidenceIndex === 0 || /[\s.!?;:()[\]"']/.test(LONG_PROFESSIONAL_SECTOR_SENTENCE[evidenceIndex - 1]));
check("J11. sector evidence includes the affirmative sector phrase", Boolean(sectorEvidence && /professional services|administrative support/i.test(sectorEvidence)));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll Fixture A anchor regression checks passed.");
