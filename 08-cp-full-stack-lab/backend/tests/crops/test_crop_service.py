# tests/crops/test_crop_service.py

import sqlite3
from app.crops.service import list_crops
from app.conventions import BackendKeys, OutcomeKind

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT

SEEDED_CROPS = [
    (1, "Durum"), (2, "Canola"), (3, "Barley"), (4, "Green Lentils"),
    (5, "Red Lentils"), (6, "Wheat (HRSW)"), (7, "Chick Peas"), (8, "Oats"),
    (9, "Seed Oats"), (10, "Soy Beans"), (11, "Flax"), (12, "Maple Peas"),
    (13, "Fenugreek"), (14, "Hemp"),
]
CROP_FIELDS = {"id", "name", "modified_by", "modified_at"}


#   --- list_crops  ------------------------------------------------------------

def test_list_crops_returns_seeded_crops_in_id_order(db_path):
    result = list_crops(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert [(r["id"], r["name"]) for r in result[RESULT]] == SEEDED_CROPS

def test_list_crops_exact_field_set(db_path):
    records = list_crops(db_path)[RESULT]
    assert len(records) > 0
    for record in records:
        assert set(record.keys()) == CROP_FIELDS

def test_list_crops_empty_table_returns_empty_list(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("DELETE FROM crops")
        conn.commit()
    finally:
        conn.close()

    result = list_crops(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert result[RESULT] == []

def test_list_crops_no_schema_returns_unknown(db_without_schema):
    result = list_crops(db_without_schema)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result