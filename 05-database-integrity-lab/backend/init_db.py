from pathlib import Path
import sqlite3
import os 

from app.config import DB_PATH

SCHEMA_SQL = (Path(__file__).resolve().parent / "app" / "db" / "schema.sql").read_text()

def main():
    db_path = DB_PATH
    if os.path.exists(db_path): os.remove(db_path)
    print("New database created at: ", db_path)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA_SQL)
    conn.execute("PRAGMA journal_mode = WAL")
    client_id = conn.execute("INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?) RETURNING id", ("Farm A", "farm_a", "Zhe")).fetchone()[0]
    conn.execute("INSERT INTO client_note (client_id, note) VALUES (?, ?)", (client_id, "test"))
    conn.commit()
    conn.close()
    

if __name__ == "__main__":
    main()