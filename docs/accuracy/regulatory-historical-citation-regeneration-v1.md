# Regulatory Historical Citation Regeneration v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

Historical source selection identifies which approved official-source snapshot governed a grounded contract date. This phase then rebuilds each citation from that selected immutable snapshot using the repository's registered extraction request.

A supplied citation is not trusted merely because its source ID, snapshot ID, checksum, and excerpt are internally consistent. The historically selected snapshot must contain the registered start anchor, end anchor, and required anchors, and deterministic extraction must reproduce the registered passage and line provenance.

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

## Regeneration sequence

The regeneration layer:

1. runs historical grounding orchestration;
2. refuses unresolved dates, policies, source versions, or citation provenance;
3. obtains the immutable snapshot selected for each declared source;
4. retrieves the repository's single registered citation template for the mapping;
5. reconstructs the extraction requests from the template's retained anchors;
6. extracts each passage again from the selected historical snapshot;
7. validates complete source coverage; and
8. compares the regenerated passages, checksums, anchors, character limits, and line provenance with the supplied package.

Only an exact match is `ready`. The result remains benchmark-only.

## Anchor-drift refusal

Regeneration refuses when:

- a registered start or end anchor is missing;
- a registered anchor appears more than once;
- the end anchor precedes the start anchor;
- a required in-excerpt anchor is absent;
- the excerpt becomes suspiciously short;
- the passage exceeds the registered maximum length; or
- the registered template omits or adds a source.

The system does not select the first approximate match, broaden the excerpt automatically, or silently replace the registered anchors with current wording.

## Exact-but-unregistered passages

An alternative passage may be a genuine exact substring of the selected source snapshot and may have a correct checksum. It is still refused when it is not the passage produced by the registered extraction request.

This prevents a caller from substituting a less relevant paragraph from the correct source version while preserving otherwise valid provenance metadata.

## Line provenance

The regenerated start and end line numbers must match the supplied citation. An exact excerpt with incorrect line provenance is refused. This supports inspectable reviewer output and prevents later report citations from pointing to the wrong location within a retained source snapshot.

## Regression coverage

The benchmark proves that:

- registered anchors regenerate a complete CMMC citation package from source-specific historical snapshots;
- the solicitation-date DFARS 252.204-7025 citation is rebuilt from the older selected snapshot;
- retained extraction metadata and line provenance survive regeneration;
- missing anchors are refused as historical anchor drift;
- duplicate anchors are refused as ambiguous;
- exact but unregistered passages are refused;
- incorrect line provenance is refused; and
- regeneration does not run when the governing contract date is unresolved.

## Customer-facing boundary

This phase is not connected to the live analyzer or report renderer. It does not change findings, ranking, signing posture, redlines, customer records, payments, authentication, deployment, or production configuration.

Before customer-facing integration, SubShield still requires complete reviewed historical source archives, production-safe snapshot retrieval, approved update operations when official wording changes, report language for anchor drift and unavailable history, privacy/security review, and explicit approval for analyzer behavior changes.
