# tests/forecast/years/test_forecast_year_service.py

import sqlite3 
from app.forecast.years.service import list_years
from app.conventions import BackendKeys, OutcomeKind

OUTCOME = BackendKeys.OUTCOME
RESULT = BackendKeys.RESULT


#   --- list_years  ------------------------------------------------------------------

def test_list_years_returns_pre_seed_years(db_path):
    result = list_years(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result
    records = result[RESULT]
    assert [r["forecast_year"] for r in records] == [2026, 2027, 2028, 2029]

def test_list_years_contains_all_cols(db_path):
    result = list_years(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result
    records = result[RESULT]
    keys = ["forecast_year", "modified_by", "modified_at"]
    for i, record in enumerate(records):
        assert set(record.keys()) == set(keys)

def test_list_years_order_comes_from_ordering_not_insertion(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("INSERT INTO forecast_years (forecast_year, modified_by) VALUES (?, ?)", (2001, "Zhe"))
        conn.commit()
    finally:
        conn.close()
    result = list_years(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result
    records = result[RESULT]
    assert records[0]["forecast_year"] == 2001

def test_list_years_no_schema_returns_unknown(db_without_schema):
    result = list_years(db_without_schema)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN

def test_list_years_empty_table_returns_empty_list(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("DELETE FROM forecast_years")
        conn.commit()
    finally:
        conn.close()
    result = list_years(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert result[RESULT] == []