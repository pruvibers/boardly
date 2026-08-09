import os
from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def isolate_database(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BOARDLY_DB_PATH", str(tmp_path / "boardly-tests.sqlite3"))
