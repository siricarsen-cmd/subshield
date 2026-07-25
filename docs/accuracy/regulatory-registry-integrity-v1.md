# Regulatory Registry Integrity v1

Status: controlled benchmark foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

The regulatory benchmark uses stable mapping IDs to join contract evidence, applicability conclusions, governing-date policies, official-source comparisons, and citation extraction templates. An ID alone is not sufficient proof that the accompanying object is the approved object.

This phase captures immutable canonical registries and deterministic fingerprints for:

- all twelve QA-C and QA-D applicability mappings;
- all twelve source-specific historical grounding policies; and
- all twelve complete citation templates.

A caller cannot reuse a valid ID while changing conclusions, sources, missing facts, date bases, anchors, excerpts, or other registered content.

## Canonical capture

At module initialization, each registered value is:

1. deeply cloned from the exported benchmark definition;
2. serialized deterministically with sorted object keys and preserved array order;
3. assigned a SHA-256 fingerprint; and
4. deeply frozen, including nested arrays and objects.

The registry owns its captured clone. Later runtime mutation of another exported benchmark object cannot alter the canonical registry or its fingerprint.

## Mapping integrity

Historical selection compares every supplied applicability mapping with the canonical mapping fingerprint before date extraction or source selection.

An altered mapping is refused as `invalid-mapping`, even when it retains a real mapping ID and the same declared source IDs. This prevents changes to evidence quotes, applicability status, comparison status, supporting facts, missing facts, prohibited inferences, document requests, or reviewer conclusions from entering the grounding pipeline under an approved identity.

The canonical mapping—not the caller object—is used to validate the registered policy and build regenerated citation packages.

## Governing-date policy integrity

The historical policy registry captures every source-specific date basis and rationale. A supplied policy is optional, but when present its complete fingerprint must match the canonical policy.

A policy cannot retain its registered ID while changing a solicitation provision to use the subcontract execution date, changing source order, omitting a source, adding a source, or altering its rationale.

## Citation-template integrity

Historical citation regeneration reads extraction templates only from the immutable template registry. The registered start anchor, end anchor, required anchors, locator, character limit, conclusions, and complete package content are fingerprinted.

A valid mapping ID cannot be used with modified anchors or an alternative template. Regeneration builds from the canonical mapping and canonical template after the supplied mapping has passed fingerprint validation.

## Fingerprint rules

The fingerprint serializer:

- sorts object keys;
- preserves array order;
- preserves `undefined`, `null`, booleans, finite numbers, negative zero, and special numeric values distinctly; and
- rejects unsupported runtime value types.

Equivalent plain objects with different key insertion order produce the same fingerprint. Any substantive mapping, policy, or template change produces a different fingerprint.

## Regression coverage

The benchmark proves that:

- all three registries contain one entry for each of the twelve mappings;
- every entry and nested value is frozen;
- every stored fingerprint reproduces from the frozen value;
- object key insertion order does not affect fingerprints;
- exact clones pass comparison;
- altered mapping conclusions are refused before date or source evaluation;
- altered mappings cannot obtain registered extraction requests;
- altered source-specific date bases are refused;
- altered extraction anchors are detected;
- runtime mutation of exported benchmark objects cannot mutate the canonical registry; and
- unknown IDs cannot borrow another registry entry.

## Customer-facing boundary

This phase is not connected to the live analyzer or report renderer. It does not change findings, ranking, signing posture, redlines, customer records, payments, authentication, deployment, or production configuration.

Before customer-facing integration, registry updates will require a controlled review and release process that records the previous fingerprint, new fingerprint, reason for change, official-source evidence, benchmark impact, and approval decision.
