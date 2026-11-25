# tests/definitions/crops/test_crop_api.py

from tests.definitions.crops.test_crop_service import SEEDED_CROPS, CROP_FIELDS


#   --- GET /crops  ------------------------------------------------------------

def test_get_crops_returns_seeded_crops_in_id_order(api):
    response = api.get("definitions/crops")
    assert response.status_code == 200, response.text
    assert [(r["id"], r["name"]) for r in response.json()] == SEEDED_CROPS

def test_get_crops_exact_field_set(api):
    response = api.get("definitions/crops")
    assert response.status_code == 200, response.text
    records = response.json()
    assert len(records) > 0
    for record in records:
        assert set(record.keys()) == CROP_FIELDS

def test_get_crops_db_failure_is_500(api_no_raise):
    response = api_no_raise.get("definitions/crops")
    assert response.status_code == 500, response.text