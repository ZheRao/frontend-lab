# tests/revisions/test_revision_service.py

import sqlite3
from app.revisions.service import list_revisions
from app.conventions import BackendKeys, OutcomeKind

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

SEEDED_REVISIONS = [
    (1, "Pre-seeding", 1),
    (2, "Post-seeding", 2),
    (3, "Pre-harvest", 3),
    (4, "Post-harvest", 4),
]
REVISION_FIELDS = {"id", "name", "revision_order", "modified_by", "modified_at"}


#   --- list_revisions  --------------------------------------------------------

def test_list_revisions_returns_seeded_revisions_in_order(db_path):
    result = list_revisions(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert [(r["id"], r["name"], r["revision_order"]) for r in result[RESULT]] == SEEDED_REVISIONS

def test_list_revisions_exact_field_set(db_path):
    records = list_revisions(db_path)[RESULT]
    assert len(records) > 0
    for record in records:
        assert set(record.keys()) == REVISION_FIELDS

def test_list_revisions_order_comes_from_revision_order_not_id(db_path):
    # id 5 is inserted last but has the lowest revision_order, so it must come first
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "INSERT INTO revisions (name, name_standardized, revision_order, modified_by) VALUES (?, ?, ?, ?)",
            ("Planning", "planning", 0, "Zhe"),
        )
        conn.commit()
    finally:
        conn.close()

    records = list_revisions(db_path)[RESULT]
    assert [r["revision_order"] for r in records] == [0, 1, 2, 3, 4]
    assert records[0]["name"] == "Planning"

def test_list_revisions_empty_table_returns_empty_list(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("DELETE FROM revisions")
        conn.commit()
    finally:
        conn.close()

    result = list_revisions(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert result[RESULT] == []

def test_list_revisions_no_schema_returns_unknown(db_without_schema):
    result = list_revisions(db_without_schema)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result