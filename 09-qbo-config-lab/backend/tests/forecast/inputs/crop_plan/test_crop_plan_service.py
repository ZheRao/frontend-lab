# tests/forecast/inputs/crop_plan/test_crop_plan_service.py

import sqlite3
from datetime import datetime, timezone, timedelta

from app.conventions import BackendKeys, OutcomeKind
from app.forecast.inputs.crop_plan.service import retrieve_categories, retrieve_records, create_record
from tests.forecast.inputs.crop_plan.helpers import committed_crop_plan, use_create_record

OUTCOME, RESULT = BackendKeys.OUTCOME, BackendKeys.RESULT

#   --- helpers: some may move to helpers.py later   ----------------------------

#   --- retrieve_records    ---------------------------------------

def test_crop_plan_empty_workspace(db_path):
    # expects [] and refreshed response
    result = retrieve_records(db_path, client_id=1, forecast_year=2026)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result
    assert result[RESULT] == []

def test_crop_plan_one_valid_record(db_path, make_record):
    # insert one valid client and year for crop plan, everything else should return []
    forecast_year = 2026
    insert_result = make_record(client_idx=0, forecast_year=forecast_year)
    client_id = insert_result[RESULT]["client_id"]

    result1 = retrieve_records(db_path, client_id=client_id, forecast_year=forecast_year)
    assert result1[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result1
    assert len(result1[RESULT]) == 1
    assert result1[RESULT][0]["client_id"] == client_id 
    assert result1[RESULT][0]["forecast_year"] == forecast_year 

    result2 = retrieve_records(db_path, client_id=999, forecast_year=forecast_year)
    assert result2[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result2
    assert result2[RESULT] == []

    result3 = retrieve_records(db_path, client_id=client_id, forecast_year=2027)
    assert result3[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result3
    assert result3[RESULT] == []

def test_crop_plan_multiple_insertion_same_crop_same_category_preserve_history(db_path, make_record):
    # insert three values to the same crop and category, expect 3 rows with no deduplication
    insert_result = make_record(client_idx=0, forecast_year=2026, crop_id=1, category_key="acres", value=10)
    make_record(client_idx=0, forecast_year=2026, crop_id=1, category_key="acres", value=100)
    make_record(client_idx=0, forecast_year=2026, crop_id=1, category_key="acres", value=1000)
    client_id = insert_result[RESULT]["client_id"]

    result = retrieve_records(db_path,client_id=client_id, forecast_year=2026)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result 
    records = result[RESULT]
    assert len(records) == 3
    assert records[0]["value"] == 1000
    assert records[1]["value"] == 100
    assert records[2]["value"] == 10

def test_crop_plan_returned_records_includes_all_fields(db_path, make_record):
    # normal insert, check refreshed records contain all necessary fields
    insert_result = make_record(client_idx=0, forecast_year=2026)
    client_id = insert_result[RESULT]["client_id"]

    result = retrieve_records(db_path, client_id, 2026)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result 
    record = result[RESULT][0]
    fields = ["id", "client_id", "forecast_year", "crop_id", "revision_id", "category_key", "value", "modified_by", "memo", "created_at"]
    for col in fields:
        assert col in record

def test_crop_plan_stored_zero_returns_as_zero(db_path, make_record):
    insert_result = make_record(client_idx=0, forecast_year=2026, value=0)
    client_id = insert_result[RESULT]["client_id"]

    result = retrieve_records(db_path, client_id, 2026)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result 
    record = result[RESULT][0]
    assert record["value"] == 0

def test_crop_plan_unknown_for_no_schema(db_without_schema):
    result = retrieve_records(db_without_schema, 1, 2026)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

#   --- retrieve_categories -----------------------------------------------------

def test_crop_plan_category_contains_all_10_keys(db_path):
    keys = ['prior.quantity_inventory', 'prior.unit_price', 'acres', 'unit_price', 'yield', 'chem_cost', 'fert_cost', 'fuel_cost', 'rent_cost', 'seed_cost']
    result = retrieve_categories(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result 
    records = result[RESULT]
    categories = [r["key"] for r in records]
    assert set(keys) == set(categories)

def test_crop_plan_category_has_all_4_cols_per_row(db_path):
    result = retrieve_categories(db_path)
    assert result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in result 
    records = result[RESULT]
    for row in records:
        for col in ["key", "crop_year", "label", "unit"]:
            assert col in row

def test_crop_plan_category_unknown_for_no_schema(db_without_schema):
    result = retrieve_categories(db_without_schema)
    assert result[OUTCOME] == OutcomeKind.UNKNOWN
    assert RESULT not in result

#   --- create_record   ----------------------------------------------

def test_corp_plan_append_normal(db_path, client_ids):
    # normal append, expect normal results echoing submitted fields
    client_id = client_ids[0]
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(
        client_id=client_id,
        forecast_year=2026,
        crop_id=1,
        revision_id=1,
        category_key="unit_price",
        value=80,
        memo="Test",
        modified_by="Test User"
    )
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    record = result[RESULT]
    assert record["id"] > 0
    assert record["client_id"] == client_id 
    assert record["forecast_year"] == 2026
    assert record["crop_id"] == 1
    assert record["revision_id"] == 1
    assert record["category_key"] == "unit_price"
    assert record["value"] == 80
    assert record["memo"] == "Test"
    assert record["modified_by"] == "Test User"

def test_crop_plan_append_timestamp_format_and_database_assigned(db_path, client_ids):
    # normal append, expect the create_at to be assigned to now, and to end in Z and parses with datetime.fromisoformat
    def is_valid_timestamp(time_str):
        try:
            datetime.fromisoformat(time_str)
            return True 
        except:
            return False
    create_fn = use_create_record(db_path, client_ids)
    before = datetime.now(timezone.utc)
    result = create_fn()
    after = datetime.now(timezone.utc)
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    timestamp = result[RESULT]["created_at"]
    assert isinstance(timestamp, str) 
    assert timestamp.endswith("Z")
    assert is_valid_timestamp(timestamp)
    timestamp_converted = datetime.fromisoformat(timestamp)
    assert before - timedelta(seconds=1) <= timestamp_converted <= after

def test_crop_plan_append_memo_none(db_path, client_ids):
    # normal append with missing memo, result should contain missing memo
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(memo=None)
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    record = result[RESULT]
    assert record["memo"] is None

def test_crop_plan_append_zero_is_accepted(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(value=0)
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    record = result[RESULT]
    assert record["value"] == 0

def test_crop_plan_append_decimal_value_round_trip(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(value=80.999)
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    record = result[RESULT]
    assert record["value"] == 80.999

def test_crop_plan_append_negative_value_rejected(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(value=-10)
    assert result[OUTCOME] == OutcomeKind.INVALID_VALUE
    db_result = committed_crop_plan(db_path)
    assert db_result == []

def test_crop_plan_append_referencing_non_existing_client_crop_revision_category_forecastyear(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    def check_failed_reference(result):
        assert result[OUTCOME] == OutcomeKind.INVALID_REFERENCE
        db_result = committed_crop_plan(db_path)
        assert db_result == []
    # non existing year
    check_failed_reference(create_fn(forecast_year=9999))
    # non existing crop
    check_failed_reference(create_fn(crop_id=99))
    # non existing revision
    check_failed_reference(create_fn(revision_id=99))
    # non existing category
    check_failed_reference(create_fn(category_key="non_existing"))
    # non existing client
    check_failed_reference(create_fn(client_id=999))

def test_crop_plan_append_read_after_write(db_path,client_ids):
    client_id = client_ids[0]
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(
        client_id=client_id,
        forecast_year=2026,
        crop_id=1,
        revision_id=1,
        category_key="unit_price",
        value=80,
        memo="Test",
        modified_by="Test User"
    )
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result 
    read_result = retrieve_records(db_path,client_id,2026)
    assert read_result[OUTCOME] == OutcomeKind.REFRESHED
    assert RESULT in read_result
    assert len(read_result[RESULT]) == 1
    record = read_result[RESULT][0]
    assert record["id"] > 0
    assert record["client_id"] == client_id 
    assert record["forecast_year"] == 2026
    assert record["crop_id"] == 1
    assert record["revision_id"] == 1
    assert record["category_key"] == "unit_price"
    assert record["value"] == 80
    assert record["memo"] == "Test"
    assert record["modified_by"] == "Test User"

def test_crop_plan_two_appends_second_has_higher_id(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    result1 = create_fn()
    result2 = create_fn()
    assert result1[OUTCOME] == OutcomeKind.CREATED
    assert result2[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result1 
    assert RESULT in result2
    record1, record2 = result1[RESULT], result2[RESULT]
    assert record1["id"] < record2["id"]

def test_crop_plan_append_identity_recorded(db_path, client_ids):
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn(modified_by="Zhe")
    assert result[OUTCOME] == OutcomeKind.CREATED
    assert RESULT in result
    assert result[RESULT]["modified_by"] == "Zhe"

def test_crop_plan_append_no_schema_is_unknown(db_without_schema, client_ids):
    create_fn = use_create_record(db_without_schema, client_ids)
    result = create_fn()
    assert result[OUTCOME] == OutcomeKind.UNKNOWN

def test_crop_plan_append_blocker_busy(db_path, client_ids, write_blocker2):
    client_id = client_ids[0]
    write_blocker2()
    create_fn = use_create_record(db_path, client_ids)
    result = create_fn()
    assert result[OUTCOME] == OutcomeKind.DATABASE_BUSY
