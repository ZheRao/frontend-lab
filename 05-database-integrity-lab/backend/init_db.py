from pathlib import Path
import sqlite3

from app.config import DB_NAME

SCHEMA_SQL = (Path(__file__).resolve().parent / "app" / "db" / "schema.sql").read_text()

def main():
    db_path = Path(__file__).resolve().parent / DB_NAME # database path = '..../backend/{DB_NAME}'
    print(db_path)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA_SQL)
    conn.close()
    

if __name__ == "__main__":
    main()