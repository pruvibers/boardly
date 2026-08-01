import os
import tempfile
from pathlib import Path


_database_directory = tempfile.TemporaryDirectory(prefix="boardly-tests-")
os.environ["BOARDLY_DB_PATH"] = str(
    Path(_database_directory.name) / "boardly-tests.sqlite3"
)
