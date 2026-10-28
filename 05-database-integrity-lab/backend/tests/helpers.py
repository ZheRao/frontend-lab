from app.db.sqlite_connection import unit_of_work
from app.services.naming import string_normalize

INSERT_CLIENT = "INSERT INTO clients (name, name_standardized, modified_by) VALUES (?, ?, ?)"

def insert_client(conn, name, modified_by="Test User"):
    conn.execute(INSERT_CLIENT, (name, string_normalize(name), modified_by))

def committed_names(db_path):
    """Read through a separate unit of work, so it shows only what was committed."""
    with unit_of_work(db_path) as conn:
        return [[row[0] for row in conn.execute("SELECT name FROM clients ORDER BY id")]]