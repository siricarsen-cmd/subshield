# Verified Stored Regulatory Update Pairs

Status: controlled regulatory-storage foundation  
Product scope: federal government subcontractors reviewing prime-issued subcontract and solicitation packages  
Customer-facing status: not enabled

## Purpose

Live regulatory update review must compare a newly retained official-source candidate with a trustworthy historical baseline. A caller-supplied object that merely says `reviewStatus: approved` is not sufficient.

This phase loads both snapshots from the controlled snapshot store and produces an opaque, in-memory verification pair. The pair proves that:

- the candidate is the manifest's latest observed snapshot;
- the baseline is the most recent earlier approved snapshot;
- both immutable files match their manifest entries;
- the baseline remains citation eligible;
- pending candidates do not contain final review provenance;
- approved candidates remain citation eligible;
- the candidate was retrieved after the baseline; and
- the pair's source, snapshot identities, fingerprints, and manifest fingerprint remain internally consistent.

## Prior approved baseline selection

The baseline is not always `latestApprovedSnapshotId`.

After a candidate is approved, the manifest promotes that candidate to `latestApprovedSnapshotId`. Update review still needs the prior approved version for the before/after comparison. The verifier therefore selects the most recent approved snapshot whose retrieval time precedes the candidate and whose snapshot ID differs from the candidate.

This supports both stages:

1. pending candidate versus prior approved baseline; and
2. approved retained candidate versus the same prior approved baseline.

## Opaque verification

Verified pairs are registered in a module-local `WeakSet` and deeply frozen. `isVerifiedStoredRegulatoryUpdatePair` succeeds only for the exact object created by the controlled loader.

Serializing, cloning, or manually recreating a matching-looking object removes the opaque verification. This prevents ordinary runtime callers from bypassing the storage and manifest checks with fabricated snapshots.

The pair also retains deterministic fingerprints for:

- the complete approved baseline snapshot;
- the complete candidate snapshot;
- the validated manifest; and
- a compact verification payload.

## Candidate restrictions

The verifier refuses:

- unsafe source IDs;
- missing latest-observed candidates;
- explicitly selected candidates that are not latest observed;
- candidates with no earlier approved baseline;
- rejected candidates;
- pending candidates that contain reviewer identity, timestamp, or review notes;
- invalid stored snapshots or manifest mismatches;
- non-citation-eligible approved snapshots; and
- candidates retrieved before or at the same time as the baseline.

## Persistence boundary

The verification pair is intentionally in-memory and non-serializable as a trusted credential. A new process must reload and reverify the snapshots from the controlled store.

This phase does not change source review status, write a review packet, apply a registry transition, alter an analyzer conclusion, or change a customer report.

## Regression coverage

The benchmark proves that:

- a pending-only store has no approved baseline;
- an approved snapshot cannot compare against itself;
- a latest pending candidate pairs with the prior approved snapshot;
- verified pairs are deeply frozen and opaque;
- cloned pairs lose verification;
- stale explicit candidate selection is refused;
- candidate approval retains the earlier approved comparison baseline;
- a later pending candidate rolls forward to the newest earlier approved baseline;
- pending review provenance smuggling is refused;
- candidates older than every approved snapshot are refused; and
- rejected retained candidates are refused.

## Next integration boundary

The next phase may allow the regulatory update-intake engine to accept this opaque pair as a second trusted baseline source alongside the immutable benchmark approved-evidence registry. That integration must not expose a caller-controlled trust flag and must preserve all existing pending, approval, change-control, benchmark, and customer-facing boundaries.
