#!/usr/bin/env python3
"""Temporary authenticated production acceptance for credit/report/deletion lifecycle.

All fixtures and accounts are disposable. Output contains only sanitized states,
counts, HTTP statuses, and boolean acceptance evidence.
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

MODULE_PATH = Path(__file__).with_name("_temporary_production_acceptance.py")
spec = importlib.util.spec_from_file_location("production_acceptance", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Acceptance runner module could not be loaded.")
runner = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = runner
spec.loader.exec_module(runner)

ADMIN_URL = os.environ["ACCEPTANCE_ADMIN_URL"]
OIDC_TOKEN = os.environ["ACCEPTANCE_OIDC_TOKEN"]
OWNER_EMAIL = os.environ["ACCEPTANCE_OWNER_EMAIL"]
OWNER_PASSWORD = os.environ["ACCEPTANCE_OWNER_PASSWORD"]
OWNER_ID = os.environ["ACCEPTANCE_OWNER_ID"]
INTRUDER_EMAIL = os.environ["ACCEPTANCE_INTRUDER_EMAIL"]
INTRUDER_PASSWORD = os.environ["ACCEPTANCE_INTRUDER_PASSWORD"]
INTRUDER_ID = os.environ["ACCEPTANCE_INTRUDER_ID"]
RUN_ID = os.environ.get("GITHUB_RUN_ID", "local")
STARTED_AT = datetime.now(timezone.utc).isoformat()
INCIDENT_CODES = [
    "analyzer_processing_failed_credit_restored",
    "delete_storage_cleanup_failed",
]


def admin_call(action: str, **payload: Any) -> dict[str, Any]:
    response = requests.post(
        ADMIN_URL,
        headers={
            "Authorization": f"Bearer {OIDC_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"action": action, **payload},
        timeout=30,
    )
    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError(f"Admin action {action} returned non-JSON HTTP {response.status_code}.") from exc
    if response.status_code >= 400 or not isinstance(data, dict) or data.get("ok") is not True:
        raise RuntimeError(f"Admin action {action} failed safely with HTTP {response.status_code}.")
    return data


def sign_in(email: str, password: str) -> str:
    status, payload = runner.request_json(
        "POST",
        f"{runner.SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers=runner.auth_headers(),
        json={"email": email, "password": password},
    )
    token = payload.get("access_token")
    if status != 200 or not isinstance(token, str):
        raise RuntimeError(f"Disposable sign-in failed with HTTP {status}.")
    return token


def rest_headers(token: str, *, representation: bool = False) -> dict[str, str]:
    headers = {
        "apikey": runner.SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if representation:
        headers["Prefer"] = "return=representation"
    return headers


def create_audit(
    token: str,
    user_id: str,
    *,
    file_name: str,
    status: str = "Processing",
    file_path: str | None = None,
) -> int:
    payload: dict[str, Any] = {
        "user_id": user_id,
        "file_name": file_name,
        "status": status,
    }
    if file_path is not None:
        payload["file_path"] = file_path
    response = requests.post(
        f"{runner.SUPABASE_URL}/rest/v1/contract_audits?select=id",
        headers=rest_headers(token, representation=True),
        json=payload,
        timeout=30,
    )
    rows = response.json() if response.headers.get("content-type", "").startswith("application/json") else None
    if response.status_code not in (200, 201) or not isinstance(rows, list) or not rows:
        raise RuntimeError(f"Disposable audit creation failed with HTTP {response.status_code}.")
    audit_id = rows[0].get("id")
    if not isinstance(audit_id, int):
        raise RuntimeError("Disposable audit creation returned no numeric ID.")
    return audit_id


def select_audit(token: str, audit_id: int) -> list[dict[str, Any]]:
    response = requests.get(
        f"{runner.SUPABASE_URL}/rest/v1/contract_audits",
        headers=rest_headers(token),
        params={
            "id": f"eq.{audit_id}",
            "select": "id,user_id,status,ai_results,file_path,deletion_previous_status,deletion_started_at",
        },
        timeout=30,
    )
    data = response.json() if response.headers.get("content-type", "").startswith("application/json") else None
    if response.status_code != 200 or not isinstance(data, list):
        raise RuntimeError(f"Audit read failed with HTTP {response.status_code}.")
    return data


def current_credits(token: str) -> int:
    credits = runner.current_credits(token)
    if not isinstance(credits, int):
        raise RuntimeError("Credit balance could not be verified.")
    return credits


def analyze_paste(token: str, audit_id: int) -> tuple[int, dict[str, Any], float]:
    started = time.monotonic()
    status, payload = runner.request_json(
        "POST",
        f"{runner.PRODUCTION_URL}/api/analyze-contract",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "text": runner.CANONICAL_TEXT,
            "fileName": "Pasted contract text",
            "auditId": str(audit_id),
        },
    )
    return status, payload, round(time.monotonic() - started, 2)


def analyze_malformed_docx(token: str, audit_id: int) -> tuple[int, dict[str, Any], float]:
    started = time.monotonic()
    response = requests.post(
        f"{runner.PRODUCTION_URL}/api/analyze-contract",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "malformed-acceptance.docx",
                b"This is intentionally not a ZIP-based DOCX package.",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ),
            "auditId": (None, str(audit_id)),
        },
        timeout=110,
    )
    try:
        payload = response.json()
    except ValueError:
        payload = {"nonJsonResponse": True}
    return response.status_code, payload if isinstance(payload, dict) else {}, round(time.monotonic() - started, 2)


def delete_review(token: str, audit_id: int) -> tuple[int, dict[str, Any]]:
    status, payload = runner.request_json(
        "POST",
        f"{runner.PRODUCTION_URL}/api/delete-review",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"id": audit_id},
    )
    return status, payload


def upload_object(token: str, path: str) -> int:
    response = requests.post(
        f"{runner.SUPABASE_URL}/storage/v1/object/contracts/{quote(path, safe='/')}",
        headers={
            "apikey": runner.SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "text/plain",
            "x-upsert": "false",
        },
        data=b"Fictional SubShield deletion acceptance object.",
        timeout=30,
    )
    if response.status_code not in (200, 201):
        raise RuntimeError(f"Disposable Storage upload failed with HTTP {response.status_code}.")
    return response.status_code


def object_exists(token: str, path: str) -> bool:
    response = requests.get(
        f"{runner.SUPABASE_URL}/storage/v1/object/authenticated/contracts/{quote(path, safe='/')}",
        headers={
            "apikey": runner.SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
        },
        timeout=30,
    )
    if response.status_code == 200:
        return True
    if response.status_code in (400, 404):
        return False
    raise RuntimeError(f"Disposable Storage verification failed with HTTP {response.status_code}.")


def incident_counts(snapshot: dict[str, Any]) -> dict[str, int]:
    result = {code: 0 for code in INCIDENT_CODES}
    incidents = snapshot.get("incidents")
    if isinstance(incidents, list):
        for item in incidents:
            if not isinstance(item, dict):
                continue
            code = item.get("event_code")
            count = item.get("occurrence_count")
            if code in result and isinstance(count, int):
                result[code] = count
    return result


def check(name: str, condition: bool, checks: dict[str, bool]) -> None:
    checks[name] = bool(condition)


def main() -> int:
    owner_token = sign_in(OWNER_EMAIL, OWNER_PASSWORD)
    intruder_token = sign_in(INTRUDER_EMAIL, INTRUDER_PASSWORD)
    checks: dict[str, bool] = {}
    evidence: dict[str, Any] = {"startedAt": STARTED_AT}

    baseline_incidents = incident_counts(admin_call("incidents", codes=INCIDENT_CODES))
    evidence["incidentBaseline"] = baseline_incidents

    # A completed review with a real Storage object exercises reservation,
    # completion, duplicate replay, zero-balance access, ownership, and deletion.
    storage_path = f"{OWNER_ID}/acceptance-delete-{RUN_ID}.txt"
    upload_object(owner_token, storage_path)
    completed_audit_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="acceptance-delete.txt",
        status="Processing",
        file_path=storage_path,
    )
    credits_before = current_credits(owner_token)
    complete_status, _, complete_seconds = analyze_paste(owner_token, completed_audit_id)
    credits_after = current_credits(owner_token)
    completed_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=completed_audit_id)

    check("successfulAnalysisHttp200", complete_status == 200, checks)
    check("successfulAnalysisConsumedOneCredit", credits_after == credits_before - 1, checks)
    check(
        "successfulAnalysisCompletedSingleReservation",
        completed_snapshot.get("audit", {}).get("status") == "Review Ready"
        and completed_snapshot.get("reservation", {}).get("status") == "completed"
        and completed_snapshot.get("reservation", {}).get("attemptCount") == 1,
        checks,
    )
    check("uploadedObjectPresentBeforeDeletion", object_exists(owner_token, storage_path), checks)

    duplicate_before = current_credits(owner_token)
    duplicate_status, _, duplicate_seconds = analyze_paste(owner_token, completed_audit_id)
    duplicate_after = current_credits(owner_token)
    duplicate_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=completed_audit_id)
    check("duplicateSubmissionHttp200", duplicate_status == 200, checks)
    check("duplicateSubmissionDidNotChargeTwice", duplicate_after == duplicate_before, checks)
    check(
        "duplicateSubmissionDidNotCreateAnotherAttempt",
        duplicate_snapshot.get("reservation", {}).get("attemptCount") == 1
        and duplicate_snapshot.get("reservation", {}).get("status") == "completed",
        checks,
    )

    admin_call("set_credits", userId=OWNER_ID, credits=0)
    owner_rows_at_zero = select_audit(owner_token, completed_audit_id)
    intruder_rows = select_audit(intruder_token, completed_audit_id)
    check(
        "completedReportAccessibleAtZeroCredits",
        current_credits(owner_token) == 0
        and len(owner_rows_at_zero) == 1
        and owner_rows_at_zero[0].get("status") == "Review Ready"
        and isinstance(owner_rows_at_zero[0].get("ai_results"), dict),
        checks,
    )
    check("reportOwnershipBlocksOtherUser", intruder_rows == [], checks)

    intruder_delete_status, _ = delete_review(intruder_token, completed_audit_id)
    check("deleteOwnershipBlocksOtherUser", intruder_delete_status == 403, checks)
    check("intruderDeleteLeftOwnerReviewIntact", len(select_audit(owner_token, completed_audit_id)) == 1, checks)

    owner_delete_status, owner_delete_payload = delete_review(owner_token, completed_audit_id)
    deleted_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=completed_audit_id)
    check(
        "ownerDeletionRemovedCustomerFacingAudit",
        owner_delete_status == 200
        and owner_delete_payload.get("success") is True
        and select_audit(owner_token, completed_audit_id) == []
        and deleted_snapshot.get("audit", {}).get("exists") is False,
        checks,
    )
    check("ownerDeletionRemovedStorageObject", not object_exists(owner_token, storage_path), checks)
    check(
        "completedReservationLedgerSurvivedReviewDeletion",
        deleted_snapshot.get("reservation", {}).get("exists") is True
        and deleted_snapshot.get("reservation", {}).get("status") == "completed"
        and deleted_snapshot.get("reservation", {}).get("attemptCount") == 1,
        checks,
    )

    # A malformed supported file fails after reservation and must restore credit.
    admin_call("set_credits", userId=OWNER_ID, credits=2)
    malformed_audit_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="malformed-acceptance.docx",
        status="Processing",
    )
    failure_before = current_credits(owner_token)
    failure_status, failure_payload, failure_seconds = analyze_malformed_docx(owner_token, malformed_audit_id)
    failure_after = current_credits(owner_token)
    failure_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=malformed_audit_id)
    check("controlledProcessingFailureReturnedError", failure_status >= 400, checks)
    check(
        "controlledProcessingFailureRestoredCredit",
        failure_after == failure_before
        and failure_payload.get("creditRestored") is True
        and failure_snapshot.get("audit", {}).get("status") == "Processing Failed"
        and failure_snapshot.get("reservation", {}).get("status") == "refunded"
        and failure_snapshot.get("reservation", {}).get("finalized") is True,
        checks,
    )

    # Reserve through the real production RPC and verify deletion is blocked.
    active_audit_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="active-processing-acceptance.txt",
        status="Processing",
    )
    reserve_before = current_credits(owner_token)
    reserve_result = admin_call("reserve", userId=OWNER_ID, auditId=active_audit_id)
    reserve_after = current_credits(owner_token)
    active_delete_status, _ = delete_review(owner_token, active_audit_id)
    active_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=active_audit_id)
    check(
        "activeProcessingReservationConsumedOneCredit",
        reserve_result.get("outcome") == "reserved" and reserve_after == reserve_before - 1,
        checks,
    )
    check(
        "deletionDuringActiveProcessingBlocked",
        active_delete_status == 409
        and active_snapshot.get("audit", {}).get("status") == "Processing"
        and active_snapshot.get("reservation", {}).get("status") == "reserved",
        checks,
    )

    # An intentionally invalid, non-existent Storage key forces cleanup failure.
    # The route must restore the truthful prior audit state and record the fixed
    # sanitized incident code. No real Storage object is addressed.
    invalid_path = f"{OWNER_ID}/" + ("x" * 5000)
    storage_failure_audit_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="storage-cleanup-failure-acceptance.txt",
        status="Review Ready",
        file_path=invalid_path,
    )
    storage_delete_status, _ = delete_review(owner_token, storage_failure_audit_id)
    storage_failure_snapshot = admin_call("inspect", userId=OWNER_ID, auditId=storage_failure_audit_id)
    check("controlledStorageCleanupReturnedError", storage_delete_status >= 500, checks)
    check(
        "failedStorageCleanupRestoredTruthfulState",
        storage_failure_snapshot.get("audit", {}).get("exists") is True
        and storage_failure_snapshot.get("audit", {}).get("status") == "Review Ready"
        and storage_failure_snapshot.get("audit", {}).get("deletionPreviousStatusPresent") is False
        and storage_failure_snapshot.get("audit", {}).get("deletionStartedAtPresent") is False,
        checks,
    )

    incident_after = incident_counts(admin_call("incidents", codes=INCIDENT_CODES))
    evidence["incidentAfter"] = incident_after
    check(
        "confirmedFailureRecordedSanitizedRestorationIncident",
        incident_after["analyzer_processing_failed_credit_restored"]
        == baseline_incidents["analyzer_processing_failed_credit_restored"] + 1,
        checks,
    )
    check(
        "storageFailureRecordedSanitizedIncident",
        incident_after["delete_storage_cleanup_failed"]
        == baseline_incidents["delete_storage_cleanup_failed"] + 1,
        checks,
    )

    final_snapshot = admin_call("inspect", userId=OWNER_ID)
    check(
        "reservationLedgerRemainsConsistent",
        final_snapshot.get("auditCount") == 3
        and final_snapshot.get("reservationCount") == 3,
        checks,
    )

    evidence.update(
        {
            "successfulAnalysis": {
                "httpStatus": complete_status,
                "seconds": complete_seconds,
                "creditsBefore": credits_before,
                "creditsAfter": credits_after,
                "reservationStatus": completed_snapshot.get("reservation", {}).get("status"),
                "attemptCount": completed_snapshot.get("reservation", {}).get("attemptCount"),
            },
            "duplicateSubmission": {
                "httpStatus": duplicate_status,
                "seconds": duplicate_seconds,
                "creditsBefore": duplicate_before,
                "creditsAfter": duplicate_after,
                "attemptCount": duplicate_snapshot.get("reservation", {}).get("attemptCount"),
            },
            "zeroCreditReport": {
                "ownerVisible": len(owner_rows_at_zero) == 1,
                "intruderVisible": len(intruder_rows) > 0,
            },
            "deletion": {
                "intruderHttpStatus": intruder_delete_status,
                "ownerHttpStatus": owner_delete_status,
                "storageObjectExistsAfter": object_exists(owner_token, storage_path),
                "reservationStatusAfter": deleted_snapshot.get("reservation", {}).get("status"),
            },
            "processingFailure": {
                "httpStatus": failure_status,
                "seconds": failure_seconds,
                "creditsBefore": failure_before,
                "creditsAfter": failure_after,
                "auditStatus": failure_snapshot.get("audit", {}).get("status"),
                "reservationStatus": failure_snapshot.get("reservation", {}).get("status"),
            },
            "activeProcessing": {
                "reserveOutcome": reserve_result.get("outcome"),
                "deleteHttpStatus": active_delete_status,
                "auditStatus": active_snapshot.get("audit", {}).get("status"),
                "reservationStatus": active_snapshot.get("reservation", {}).get("status"),
            },
            "storageFailure": {
                "deleteHttpStatus": storage_delete_status,
                "restoredStatus": storage_failure_snapshot.get("audit", {}).get("status"),
            },
            "ledger": {
                "remainingDisposableAuditsBeforeCleanup": final_snapshot.get("auditCount"),
                "remainingDisposableReservationsBeforeCleanup": final_snapshot.get("reservationCount"),
            },
        }
    )

    output = {
        "runId": RUN_ID,
        "startedAt": STARTED_AT,
        "checks": checks,
        "allChecksPassed": all(checks.values()),
        "evidence": evidence,
    }
    Path("acceptance-result.json").write_text(
        json.dumps(output, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(output, indent=2, sort_keys=True))

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        passed = sum(1 for value in checks.values() if value)
        lines = [
            "# P0-C Credit / Report / Deletion Acceptance",
            "",
            f"Checks passed: {passed}/{len(checks)}",
            "",
            "| Check | Result |",
            "|---|---|",
            *[f"| {name} | {'PASS' if value else 'FAIL'} |" for name, value in checks.items()],
            "",
        ]
        with open(summary_path, "a", encoding="utf-8") as handle:
            handle.write("\n".join(lines))

    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
