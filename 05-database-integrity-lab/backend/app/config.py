from pathlib import Path

_current_path = Path(__file__).resolve()

BUSY_TIMEOUT = 1

DB_PATH = str(_current_path.parent.parent / "dev.db")