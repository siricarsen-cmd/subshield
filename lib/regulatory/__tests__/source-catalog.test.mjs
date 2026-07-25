import {
  APPROVED_OFFICIAL_DOMAIN_SUFFIXES,
  REGULATORY_SOURCE_CATALOG,
  getRegulatorySource,
  isApprovedOfficialHostname,
  isApprovedOfficialUrl,
} from "../source-catalog.ts";

let assertions = 0;
let failures = 0;

function check(label, condition, details = "") {
  assertions++;
  if (condition) {
    console.log(`PASS: ${label}`);
    return;
  }
  console.error(`FAIL: ${label}${details ? ` — ${details}` : ""}`);
  failures++;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

check(
  "catalog contains a meaningful first official-source set",
  REGULATORY_SOURCE_CATALOG.length >= 20,
  `observed ${REGULATORY_SOURCE_CATALOG.length}`
);

const sourceIds = REGULATORY_SOURCE_CATALOG.map((source) => source.sourceId);
check(
  "source IDs are unique",
  new Set(sourceIds).size === sourceIds.length,
  `observed ${sourceIds.length - new Set(sourceIds).size} duplicate IDs`
);

for (const source of REGULATORY_SOURCE_CATALOG) {
  check(`${source.sourceId}: uses an approved HTTPS government URL`, isApprovedOfficialUrl(source.canonicalUrl), source.canonicalUrl);
  check(`${source.sourceId}: is federal jurisdiction`, source.jurisdiction === "federal");
  check(`${source.sourceId}: has an issuing authority`, Boolean(source.issuingAuthority.trim()));
  check(`${source.sourceId}: has applicability notes`, Boolean(source.applicabilityNotes.trim()));
  check(`${source.sourceId}: preserves historical snapshots`, source.requiresHistoricalSnapshots === true);

  if (source.currentVerifiedVersion) {
    check(
      `${source.sourceId}: verified version date uses ISO format`,
      isIsoDate(source.currentVerifiedVersion.verifiedAt),
      source.currentVerifiedVersion.verifiedAt
    );
    check(
      `${source.sourceId}: version provenance is an approved official URL`,
      isApprovedOfficialUrl(source.currentVerifiedVersion.provenanceUrl),
      source.currentVerifiedVersion.provenanceUrl
    );
    if (source.currentVerifiedVersion.publicationDate) {
      check(
        `${source.sourceId}: publication date uses ISO format`,
        isIsoDate(source.currentVerifiedVersion.publicationDate),
        source.currentVerifiedVersion.publicationDate
      );
    }
    if (source.currentVerifiedVersion.effectiveDate) {
      check(
        `${source.sourceId}: effective date uses ISO format`,
        isIsoDate(source.currentVerifiedVersion.effectiveDate),
        source.currentVerifiedVersion.effectiveDate
      );
    }
  }
}

for (const suffix of APPROVED_OFFICIAL_DOMAIN_SUFFIXES) {
  check(`${suffix}: exact hostname is approved`, isApprovedOfficialHostname(suffix));
  check(`${suffix}: subdomain is approved`, isApprovedOfficialHostname(`subdomain.${suffix}`));
}
check("non-government hostname is rejected", !isApprovedOfficialHostname("example.com"));
check("lookalike government hostname is rejected", !isApprovedOfficialHostname("acquisition.gov.example.com"));
check("HTTP URL is rejected", !isApprovedOfficialUrl("http://www.acquisition.gov/far"));
check("malformed URL is rejected", !isApprovedOfficialUrl("not-a-url"));

const requiredSourceIds = [
  "far-current",
  "dfars-current",
  "ecfr-title-48",
  "federal-register-acquisition",
  "dol-davis-bacon",
  "dol-service-contract-labor-standards",
  "sam-wage-determinations",
  "ecfr-29-part-1",
  "ecfr-29-part-3",
  "ecfr-29-part-4",
  "ecfr-29-part-5",
  "far-52-222-4",
  "far-52-222-6",
  "far-52-222-8",
  "far-52-222-41",
  "nist-sp-800-171-r3",
  "nist-sp-800-171a-r3",
  "dfars-252-204-7012",
  "dfars-252-204-7019",
  "dfars-252-204-7020",
  "dfars-252-204-7021",
  "dfars-252-204-7025",
  "ecfr-32-part-170",
  "dod-cmmc-program",
  "cui-registry",
];

for (const sourceId of requiredSourceIds) {
  check(`required source exists: ${sourceId}`, Boolean(getRegulatorySource(sourceId)));
}

const far = getRegulatorySource("far-current");
check("FAR current version is FAC 2026-01", far?.currentVerifiedVersion?.versionIdentifier === "FAC 2026-01");
check("FAR current effective date is preserved", far?.currentVerifiedVersion?.effectiveDate === "2026-03-13");

const dfars = getRegulatorySource("dfars-current");
check(
  "DFARS current version is Change 5/7/2026",
  dfars?.currentVerifiedVersion?.versionIdentifier === "DFARS Change 5/7/2026"
);
check("DFARS current effective date is preserved", dfars?.currentVerifiedVersion?.effectiveDate === "2026-05-07");

const nist = getRegulatorySource("nist-sp-800-171-r3");
check(
  "NIST SP 800-171 Revision 3 is versioned",
  nist?.currentVerifiedVersion?.versionIdentifier === "NIST SP 800-171 Revision 3"
);
check("NIST SP 800-171 Revision 3 publication date is preserved", nist?.currentVerifiedVersion?.publicationDate === "2024-05-14");

const wageSource = getRegulatorySource("sam-wage-determinations");
check("SAM wage determinations are a primary source", wageSource?.sourceTier === "primary");
check("SAM wage source is versioned dynamically", wageSource?.sourceType === "wage-determination-index");
check(
  "SAM wage source forbids inferred rates from invalid identifiers",
  /never infer rates or classifications/i.test(wageSource?.applicabilityNotes ?? "")
);

const guidanceSources = REGULATORY_SOURCE_CATALOG.filter((source) => source.sourceTier === "official-guidance");
check("official guidance is represented", guidanceSources.length >= 3);
check(
  "guidance sources are not mislabeled as regulations",
  guidanceSources.every((source) => source.sourceType === "guidance")
);

if (failures > 0) {
  console.error(`\n${failures} of ${assertions} regulatory source-catalog assertions failed.`);
  process.exit(1);
}

console.log(`\nAll ${assertions} regulatory source-catalog assertions passed.`);
