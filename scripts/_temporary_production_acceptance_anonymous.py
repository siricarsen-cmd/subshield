#!/usr/bin/env python3
"""Anonymous-auth adapter for the temporary production acceptance runner."""

from __future__ import annotations

import importlib.util
import sys
import time
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("_temporary_production_acceptance.py")
spec = importlib.util.spec_from_file_location("production_acceptance", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Acceptance runner module could not be loaded.")
runner = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = runner
spec.loader.exec_module(runner)


def create_disposable_user(run_id: str) -> tuple[str, str]:
    status, payload = runner.request_json(
        "POST",
        f"{runner.SUPABASE_URL}/auth/v1/signup",
        headers=runner.auth_headers(),
        json={
            "data": {
                "purpose": "subshield-production-acceptance",
                "acceptance_run_id": run_id,
            },
        },
    )
    token = payload.get("access_token")
    user = payload.get("user") if isinstance(payload.get("user"), dict) else {}
    user_id = user.get("id")
    if status not in (200, 201) or not isinstance(token, str) or not isinstance(user_id, str):
        raise RuntimeError(f"Disposable anonymous signup failed with HTTP {status}.")
    print("Disposable anonymous acceptance user created; waiting for controlled confirmation and credit grant.")
    return token, user_id


def wait_for_session_and_credits(token: str, user_id: str) -> tuple[str, str, int]:
    deadline = time.time() + 900
    last_status = None
    while time.time() < deadline:
        claim_status, claim_payload = runner.request_json(
            "POST",
            f"{runner.PRODUCTION_URL}/api/auth/claim",
            headers={"Authorization": f"Bearer {token}"},
        )
        last_status = claim_status
        credits = claim_payload.get("credits")
        if claim_status == 200 and isinstance(credits, int) and credits >= runner.EXPECTED_STARTING_CREDITS:
            print("Disposable account confirmed and acceptance credits available.")
            return token, user_id, credits
        time.sleep(10)
    raise RuntimeError(f"Timed out waiting for controlled account preparation; last claim HTTP {last_status}.")


runner.create_disposable_user = create_disposable_user
runner.wait_for_session_and_credits = wait_for_session_and_credits

if __name__ == "__main__":
    raise SystemExit(runner.main())
