#!/usr/bin/env python3
"""Focused production rerun for the scanned-PDF OCR launch gate."""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("_temporary_production_acceptance.py")
spec = importlib.util.spec_from_file_location("production_acceptance", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Acceptance runner module could not be loaded.")
runner = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = runner
spec.loader.exec_module(runner)

email = os.environ.get("ACCEPTANCE_EMAIL")
password = os.environ.get("ACCEPTANCE_PASSWORD")
if not email or not password:
    raise RuntimeError("Disposable acceptance credentials are unavailable.")

token, user_id, starting_credits = runner.wait_for_session_and_credits(email, password)
fixture = next(item for item in runner.build_fixtures() if item.key == "scanned_pdf")
_, summary = runner.analyze_fixture(token, user_id, fixture)

output = {
    "runId": os.environ.get("GITHUB_RUN_ID", "local"),
    "startingCredits": starting_credits,
    "endingCredits": runner.current_credits(token),
    "results": [summary],
    "acceptanceChecks": {
        "scannedCompleted": summary["httpStatus"] == 200,
        "completedWithinRuntimeBoundary": summary["elapsedSeconds"] < 60,
        "ocrProducedGroundedFindings": (
            summary["findingCount"] > 0
            and summary["allQuotesNearCanonical"]
            and not summary["limitedScan"]
        ),
        "safeLimitedScanFallback": (
            summary["limitedScan"]
            and summary["limitedScanReasonPresent"]
        ),
    },
}
runner.write_summary(output)
