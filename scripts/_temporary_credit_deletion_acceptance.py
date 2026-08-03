#!/usr/bin/env python3
"""Temporary authenticated production acceptance for P0-C.

Uses disposable accounts and fictional data only. Output is sanitized to HTTP
statuses, counts, state names, timings, balances, and boolean assertions.
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
RUN_ID = os.environ.get("GITHUB_RUN_ID", "local")
STARTED_AT = datetime.now(timezone.utc).isoformat()


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
        raise RuntimeError(
            f"Admin action {action} returned non-JSON HTTP {response.status_code}."
        ) from exc
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
    try:
        rows = response.json()
    except ValueError:
        rows = None
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
            "select": "id,user_id,status,ai_results,file_path",
        },
        timeout=30,
    )
    try:
        data = response.json()
    except ValueError:
        data = None
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


def delete_review(token: str, audit_id: int) -> tuple[int, dict[str, Any]]:
    return runner.request_json(
        "POST",
        f"{runner.PRODUCTION_URL}/api/delete-review",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"id": audit_id},
    )


def upload_object(token: str, path: str) -> None:
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


def storage_exists(path: str) -> bool:
    result = admin_call("storage_exists", userId=OWNER_ID, path=path)
    exists = result.get("exists")
    if not isinstance(exists, bool):
        raise RuntimeError("Storage existence result was unavailable.")
    return exists


def check(name: str, condition: bool, checks: dict[str, bool]) -> None:
    checks[name] = bool(condition)


def main() -> int:
    owner_token = sign_in(OWNER_EMAIL, OWNER_PASSWORD)
    intruder_token = sign_in(INTRUDER_EMAIL, INTRUDER_PASSWORD)
    checks: dict[str, bool] = {}
    evidence: dict[str, Any] = {"startedAt": STARTED_AT}

    # Completed review, duplicate replay, zero-credit access, ownership, Storage,
    # and customer-facing deletion.
    storage_path = f"{OWNER_ID}/acceptance-delete-{RUN_ID}.txt"
    upload_object(owner_token, storage_path)
    completed_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="acceptance-delete.txt",
        file_path=storage_path,
    )

    complete_before = current_credits(owner_token)
    complete_status, _, complete_seconds = analyze_paste(owner_token, completed_id)
    complete_after = current_credits(owner_token)
    completed = admin_call("inspect", userId=OWNER_ID, auditId=completed_id)

    check("successfulAnalysisHttp200", complete_status == 200, checks)
    check("successfulAnalysisConsumedExactlyOneCredit", complete_after == complete_before - 1, checks)
    check(
        "successfulAnalysisCompletedSingleReservation",
        completed.get("audit", {}).get("status") == "Review Ready"
        and completed.get("reservation", {}).get("status") == "completed"
        and completed.get("reservation", {}).get("attemptCount") == 1,
        checks,
    )
    check("uploadedObjectPresentBeforeDeletion", storage_exists(storage_path), checks)

    duplicate_before = current_credits(owner_token)
    duplicate_status, _, duplicate_seconds = analyze_paste(owner_token, completed_id)
    duplicate_after = current_credits(owner_token)
    duplicate = admin_call("inspect", userId=OWNER_ID, auditId=completed_id)
    check("duplicateSubmissionHttp200", duplicate_status == 200, checks)
    check("duplicateSubmissionDidNotChargeTwice", duplicate_after == duplicate_before, checks)
    check(
        "duplicateSubmissionKeptSingleAttempt",
        duplicate.get("reservation", {}).get("status") == "completed"
        and duplicate.get("reservation", {}).get("attemptCount") == 1,
        checks,
    )

    admin_call("set_credits", userId=OWNER_ID, credits=0)
    owner_rows_at_zero = select_audit(owner_token, completed_id)
    intruder_rows = select_audit(intruder_token, completed_id)
    check(
        "completedReportAccessibleAtZeroCredits",
        current_credits(owner_token) == 0
        and len(owner_rows_at_zero) == 1
        and owner_rows_at_zero[0].get("status") == "Review Ready"
        and isinstance(owner_rows_at_zero[0].get("ai_results"), dict),
        checks,
    )
    check("reportOwnershipBlocksOtherUser", intruder_rows == [], checks)

    intruder_delete_status, _ = delete_review(intruder_token, completed_id)
    check("deleteOwnershipBlocksOtherUser", intruder_delete_status == 403, checks)
    check("intruderDeleteLeftOwnerReviewIntact", len(select_audit(owner_token, completed_id)) == 1, checks)

    owner_delete_status, owner_delete_payload = delete_review(owner_token, completed_id)
    deleted = admin_call("inspect", userId=OWNER_ID, auditId=completed_id)
    second_delete_status, _ = delete_review(owner_token, completed_id)
    check(
        "ownerDeletionRemovedCustomerFacingAudit",
        owner_delete_status == 200
        and owner_delete_payload.get("success") is True
        and select_audit(owner_token, completed_id) == []
        and deleted.get("audit", {}).get("exists") is False,
        checks,
    )
    check("ownerDeletionRemovedStorageObject", not storage_exists(storage_path), checks)
    check("repeatDeletionFailsClosedAsNotFound", second_delete_status == 404, checks)
    check(
        "completedReservationLedgerSurvivedReviewDeletion",
        deleted.get("reservation", {}).get("exists") is True
        and deleted.get("reservation", {}).get("status") == "completed"
        and deleted.get("reservation", {}).get("attemptCount") == 1,
        checks,
    )

    # Insufficient-credit path must not create a reservation or consume credit.
    insufficient_id = create_audit(
        owner_token,
        OWNER_ID,
        file_name="insufficient-credit-acceptance.txt",
    )
    insufficient_status, insufficient_payload, insufficient_seconds = analyze_paste(
        owner_token,
        insufficient_id,
    )
    insufficient = admin_call("inspect", userId=OWNER_ID, auditId=insufficient_id)
    check(
        "insufficientCreditsBlockedAnalysis",
        insufficient_status == 402
        and insufficient_payload.get("code") == "INSUFFICIENT_CREDITS"
        and current_credits(owner_token) == 0
        and insufficient.get("audit", {}).get("status") == "Awaiting Credits"
        and insufficient.get("reservation", {}).get("exists") is False,
        checks,
    )
    insufficient_delete_status, _ = delete_review(owner_token, insufficient_id)
    check("awaitingCreditsReviewRemainsDeletable", insufficient_delete_status == 200, checks)

    # Controlled production refund RPC: reserve, restore, retry, restore again.
    admin_call("set_credits", userId=OWNER_ID, credits=2)
    refund_id = create_audit(owner_token, OWNER_ID, file_name="refund-lifecycle-acceptance.txt")
    refund_before = current_credits(owner_token)
    first_reserve = admin_call("reserve", userId=OWNER_ID, auditId=refund_id)
    first_reserved_balance = current_credits(owner_token)
    first_refund = admin_call("refund", userId=OWNER_ID, auditId=refund_id)
    first_refunded_balance = current_credits(owner_token)
    first_refunded = admin_call("inspect", userId=OWNER_ID, auditId=refund_id)

    retry_reserve = admin_call("reserve", userId=OWNER_ID, auditId=refund_id)
    retry_reserved_balance = current_credits(owner_token)
    retry_refund = admin_call("refund", userId=OWNER_ID, auditId=refund_id)
    retry_refunded_balance = current_credits(owner_token)
    retry_refunded = admin_call("inspect", userId=OWNER_ID, auditId=refund_id)

    check(
        "controlledFailureRestoredReservedCredit",
        first_reserve.get("outcome") == "reserved"
        and first_reserved_balance == refund_before - 1
        and first_refund.get("outcome") is True
        and first_refunded_balance == refund_before
        and first_refunded.get("audit", {}).get("status") == "Processing Failed"
        and first_refunded.get("reservation", {}).get("status") == "refunded"
        and first_refunded.get("reservation", {}).get("finalized") is True
        and first_refunded.get("reservation", {}).get("lastErrorPresent") is True,
        checks,
    )
    check(
        "retryReservationAndRefundRemainIdempotent",
        retry_reserve.get("outcome") == "reserved"
        and retry_reserved_balance == refund_before - 1
        and retry_refund.get("outcome") is True
        and retry_refunded_balance == refund_before
        and retry_refunded.get("reservation", {}).get("status") == "refunded"
        and retry_refunded.get("reservation", {}).get("attemptCount") == 2,
        checks,
    )
    refund_delete_status, _ = delete_review(owner_token, refund_id)
    check("failedReviewRemainsDeletable", refund_delete_status == 200, checks)

    # Active reservation must block deletion; after refund, deletion must succeed.
    active_id = create_audit(owner_token, OWNER_ID, file_name="active-processing-acceptance.txt")
    active_before = current_credits(owner_token)
    active_reserve = admin_call("reserve", userId=OWNER_ID, auditId=active_id)
    active_reserved_balance = current_credits(owner_token)
    active_delete_status, _ = delete_review(owner_token, active_id)
    active = admin_call("inspect", userId=OWNER_ID, auditId=active_id)
    active_refund = admin_call("refund", userId=OWNER_ID, auditId=active_id)
    active_refunded_balance = current_credits(owner_token)
    post_refund_delete_status, _ = delete_review(owner_token, active_id)

    check(
        "activeProcessingReservationConsumedOneCredit",
        active_reserve.get("outcome") == "reserved"
        and active_reserved_balance == active_before - 1,
        checks,
    )
    check(
        "deletionDuringActiveProcessingBlocked",
        active_delete_status == 409
        and active.get("audit", {}).get("status") == "Processing"
        and active.get("reservation", {}).get("status") == "reserved",
        checks,
    )
    check(
        "refundedActiveReviewCanBeDeleted",
        active_refund.get("outcome") is True
        and active_refunded_balance == active_before
        and post_refund_delete_status == 200,
        checks,
    )

    final = admin_call("inspect", userId=OWNER_ID)
    operations_response = requests.get(
        f"{runner.PRODUCTION_URL}/api/health/operations",
        timeout=30,
    )
    check(
        "reservationLedgerRemainsConsistentAfterCustomerDeletion",
        final.get("auditCount") == 0
        and final.get("reservationCount") == 3
        and final.get("credits") == 2,
        checks,
    )
    check(
        "operationalHealthRemainedOk",
        operations_response.status_code == 200
        and operations_response.json().get("status") == "ok",
        checks,
    )

    evidence.update(
        {
            "successfulAnalysis": {
                "httpStatus": complete_status,
                "seconds": complete_seconds,
                "creditsBefore": complete_before,
                "creditsAfter": complete_after,
                "reservationStatus": completed.get("reservation", {}).get("status"),
                "attemptCount": completed.get("reservation", {}).get("attemptCount"),
            },
            "duplicateSubmission": {
                "httpStatus": duplicate_status,
                "seconds": duplicate_seconds,
                "creditsBefore": duplicate_before,
                "creditsAfter": duplicate_after,
                "attemptCount": duplicate.get("reservation", {}).get("attemptCount"),
            },
            "zeroCreditReport": {
                "ownerVisible": len(owner_rows_at_zero) == 1,
                "intruderVisible": len(intruder_rows) > 0,
            },
            "deletion": {
                "intruderHttpStatus": intruder_delete_status,
                "ownerHttpStatus": owner_delete_status,
                "repeatHttpStatus": second_delete_status,
                "storageObjectExistsAfter": storage_exists(storage_path),
                "reservationStatusAfter": deleted.get("reservation", {}).get("status"),
            },
            "insufficientCredits": {
                "httpStatus": insufficient_status,
                "seconds": insufficient_seconds,
                "auditStatus": insufficient.get("audit", {}).get("status"),
                "reservationExists": insufficient.get("reservation", {}).get("exists"),
            },
            "controlledRefund": {
                "creditsBefore": refund_before,
                "firstReservedBalance": first_reserved_balance,
                "firstRefundedBalance": first_refunded_balance,
                "retryReservedBalance": retry_reserved_balance,
                "retryRefundedBalance": retry_refunded_balance,
                "attemptCount": retry_refunded.get("reservation", {}).get("attemptCount"),
                "reservationStatus": retry_refunded.get("reservation", {}).get("status"),
            },
            "activeProcessing": {
                "deleteHttpStatus": active_delete_status,
                "postRefundDeleteHttpStatus": post_refund_delete_status,
                "reservationStatusAtBlock": active.get("reservation", {}).get("status"),
            },
            "ledger": {
                "remainingCustomerAuditsBeforeCleanup": final.get("auditCount"),
                "remainingReservationsBeforeCleanup": final.get("reservationCount"),
                "credits": final.get("credits"),
            },
            "operationalHealthHttpStatus": operations_response.status_code,
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
