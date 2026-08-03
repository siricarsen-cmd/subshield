#!/usr/bin/env python3
"""Credential adapter for the temporary production acceptance runner."""

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


def use_oidc_created_user(run_id: str) -> tuple[str, str]:
    del run_id
    email = os.environ.get("ACCEPTANCE_EMAIL")
    password = os.environ.get("ACCEPTANCE_PASSWORD")
    if not email or not password:
        raise RuntimeError("Disposable acceptance credentials are unavailable.")
    print("Disposable OIDC-created acceptance user is ready.")
    return email, password


runner.create_disposable_user = use_oidc_created_user

if __name__ == "__main__":
    raise SystemExit(runner.main())
