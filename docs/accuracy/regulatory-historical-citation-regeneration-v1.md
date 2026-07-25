# Regulatory Historical Citation Regeneration v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

Historical source selection identifies which approved official-source snapshot governed a grounded contract date. This phase then rebuilds each citation from that selected immutable snapshot using the repository's registered extraction request.

A caller does not need to prebuild the historically correct package. The supplied package is optional and never controls source selection or blocks regeneration. This allows a current citation package to be converted into the package supported by older governing dates.

## Separated phases

Historical date and version selection is an independent phase. It receives the mapping, uploaded document text, approved source histories, and the registered date policy. It does not receive or inspect a citation package.

After selection succeeds, regeneration:

1. obtains the immutable snapshot selected for each declared source;
2. retrieves the repository's single registered citation template for the mapping;
3. reconstructs the extraction requests from the template's retained anchors;
4. extracts each passage from the selected historical snapshot;
5. validates complete source coverage; and
6. optionally compares a supplied package with the regenerated package.

A current, altered, or absent supplied package cannot prevent creation of the historically correct package. Comparison differences are returned separately as `matches-regenerated`, `differs-from-regenerated`, or `not-supplied`.

## Retained extraction provenance

Every benchmark citation now retains:

- the registered start anchor;
- the registered end anchor;
- the required in-excerpt anchors;
- the maximum permitted excerpt length;
- the locator;
- the exact excerpt checksum; and
- the source start and end lines.

These values are produced by the controlled extraction function, not supplied by a language model.

## Anchor-drift refusal

Regeneration itself refuses when:

- a registered start or end anchor is missing;
- a registered anchor appears more than once;
- the end anchor precedes the start anchor;
- a required in-excerpt anchor is absent;
- the excerpt becomes suspiciously short;
- the passage exceeds the registered maximum length; or
- the registered template omits or adds a source.

The system does not select the first approximate match, broaden the excerpt automatically, or silently replace the registered anchors with current wording.

## Supplied-package comparison

A supplied citation is not trusted merely because its source ID, snapshot ID, checksum, and excerpt are internally consistent. After regeneration, the supplied package is compared with the historically correct package for package conclusions, source identity, immutable snapshot provenance, exact excerpt text, checksums, registered anchors, character limits, and line provenance.

An alternative passage may be a genuine exact substring of the selected source snapshot and may have a correct checksum. It is reported as different when it is not the passage produced by the registered extraction request. Incorrect line provenance is likewise reported while the correct line range remains in the regenerated package.

Comparison differences do not erase or block the correct regenerated package. They show why the supplied package should not be reused as historical evidence.

## Regression coverage

The benchmark proves that:

- a registered/current package can be regenerated when the governing solicitation date selects an older DFARS 252.204-7025 snapshot;
- callers do not need to prebuild or supply a citation package;
- a package already built from the selected snapshots compares as an exact match;
- retained extraction metadata and line provenance survive regeneration;
- missing anchors are refused as historical anchor drift;
- duplicate anchors are refused as ambiguous;
- exact but unregistered passages are reported as supplied-package differences;
- incorrect supplied line provenance is reported while correct provenance is regenerated; and
- regeneration does not run when the governing contract date is unresolved.

## Customer-facing boundary

This phase is not connected to the live analyzer or report renderer. It does not change findings, ranking, signing posture, redlines, customer records, payments, authentication, deployment, or production configuration.

Before customer-facing integration, SubShield still requires complete reviewed historical source archives, production-safe snapshot retrieval, approved update operations when official wording changes, report language for anchor drift and unavailable history, privacy/security review, and explicit approval for analyzer behavior changes.
