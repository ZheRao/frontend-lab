# tests/crop_plan/test_crop_plan_api.py

from tests.crop_plan.helpers import committed_crop_plan, use_create_record


#   --- helpers ----------------------------------------------
def assert_errors(response, status_code, code):
    assert response.status_code == status_code
    assert "detail" in response.json()
    detail = response.json()["detail"]
    assert "code" in detail 
    assert "message" in detail 
    assert detail["code"] == code 
    assert isinstance(detail["message"], str)

def post_request_body(
    client_id: int,
    forecast_year: int=2026,
    crop_id: int=1,
    revision_id: int=1,
    category_key: str="unit_price",
    value: float=100,
    memo: str|None=None,
):
    return {
        "client_id": client_id,
        "forecast_year": forecast_year,
        "crop_id": crop_id,
        "revision_id": revision_id,
        "category_key": category_key,
        "value": value,
        "memo": memo
    }



#   --- GET /crop-plan  --------------------------------------

def test_cp_get_empty(api):
    response = api.get("/crop-plan/999/2099")
    assert response.status_code == 200, response.text 
    assert response.json() == []

def test_cp_get_normal(api, db_path, client_ids):
    # insert 1 client, 1 year, other workspace empty
    client_id1, client_id2 = client_ids
    create_fn = use_create_record(db_path, client_ids)
    create_fn(client_id=client_id1, forecast_year=2026)
    
    response1 = api.get(f"/crop-plan/{client_id1}/2026")
    assert response1.status_code == 200, response1.text
    records1 = response1.json()
    assert len(records1) == 1
    assert records1[0]["client_id"] == client_id1
    assert records1[0]["forecast_year"] == 2026

    response2 = api.get(f"/crop-plan/{client_id2}/2026")
    assert response2.status_code == 200, response2.text
    assert response2.json() == []

    response3 = api.get(f"/crop-plan/{client_id1}/2027")
    assert response3.status_code == 200, response3.text 
    assert response3.json() == []

def test_cp_get_includes_full_fields(api, db_path, client_ids):
    client_id = client_ids[0]
    create_fn = use_create_record(db_path, client_ids)
    create_fn(client_id=client_id, forecast_year=2026)

    response = api.get(f"/crop-plan/{client_id}/2026")
    assert response.status_code == 200, response.text
    record = response.json()[0]
    cols = ["id", "client_id", "forecast_year", "crop_id", "revision_id", "category_key",
            "value", "modified_by", "memo", "created_at"]
    for col in cols:
        assert col in record

def test_cp_get_malform_path_parameter_returns_auto_422(api):
    response = api.get("/crop-plan/abc/2026")
    assert response.status_code == 422, response.text 

def test_cp_get_db_failure(api_no_raise):
    response = api_no_raise.get("/crop-plan/1/2026")
    assert response.status_code == 500, response.text 


#   --- GET /crop-plan/categories   -----------------------------------

def test_cp_category_get_normal(api):
    response = api.get("/crop-plan/categories")
    assert response.status_code == 200, response.text
    records = response.json()
    # check all categories are present and check every record contains all columns
    cols = ["key", "crop_year", "label", "unit"]
    keys = ['prior.quantity_inventory', 'prior.unit_price', 'acres', 'unit_price', 'yield', 'chem_cost', 'fert_cost', 'fuel_cost', 'rent_cost', 'seed_cost']
    keys_observed = []
    for r in records:
        for c in cols:
            assert c in r 
        keys_observed.append(r["key"])
    assert set(keys) == set(keys_observed)

def test_cp_category_get_db_failure(api_no_raise):
    response = api_no_raise.get("/crop-plan/categories")
    assert response.status_code == 500, response.text 


#   --- POST /crop-plan --------------------------------------------------

def test_cp_post_normal(api, client_ids, as_user):
    # normal POST, expect all rows, with modifed_by equals "Override User"
    client_id = client_ids[0]
    response = api.post("/crop-plan", 
                        json={
                            "client_id": client_id,
                            "forecast_year": 2026,
                            "crop_id": 1,
                            "revision_id": 1,
                            "category_key": "unit_price",
                            "value": 80,
                            "memo": "test1"
                        })
    assert response.status_code == 201, response.text 
    record = response.json()
    assert record["id"] > 0
    assert record["client_id"] == client_id
    assert record["forecast_year"] == 2026
    assert record["crop_id"] == 1
    assert record["revision_id"] == 1
    assert record["category_key"] == "unit_price"
    assert record["value"] == 80
    assert record["memo"] == "test1"
    assert record["modified_by"] == "Override User"

def test_cp_post_no_memo(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id))
    assert response.status_code == 201, response.text 
    assert response.json()["memo"] is None 

def test_cp_post_zero_value(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, value=0))
    assert response.status_code == 201, response.text 
    assert response.json()["value"] == 0

def test_cp_post_negative_value(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id,value=-80))
    assert_errors(response, 422, "INVALID_VALUE")

def test_cp_post_invalid_reference(api, client_ids, as_user, db_path):
    client_id = client_ids[0]
    # invalid client id
    response = api.post("/crop-plan", json=post_request_body(client_id=999))
    assert_errors(response, 422, "INVALID_REFERENCE")
    # invalid year
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, forecast_year=9999))
    assert_errors(response, 422, "INVALID_REFERENCE")
    # invalid revision
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, revision_id=99))
    assert_errors(response, 422, "INVALID_REFERENCE")
    # invalid category
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, category_key="not_exist"))
    assert_errors(response, 422, "INVALID_REFERENCE")
    # invalid crop
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, crop_id=99))
    assert_errors(response, 422, "INVALID_REFERENCE")
    # no database written
    db_results = committed_crop_plan(db_path)
    assert db_results == []

def test_cp_post_wrong_type_or_missing_returns_auto_422(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id, value="abc"))
    assert response.status_code == 422, response.text 
    response = api.post("/crop-plan", json={
                            "client_id": client_id,
                            "forecast_year": 2026,
                            "crop_id": 1,
                            "revision_id": 1,
                            "category_key": "unit_price"
                        })
    assert response.status_code == 422, response.text

def test_cp_post_client_supplied_id_createdat_modifiedby_ignored(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", 
                        json={
                            "id": 999,
                            "client_id": client_id,
                            "forecast_year": 2026,
                            "crop_id": 1,
                            "revision_id": 1,
                            "category_key": "unit_price",
                            "value": 80,
                            "memo": "test1",
                            "created_at": "ignore",
                            "modified_by": "ignore"
                        })
    assert response.status_code == 201, response.text 
    record = response.json()
    assert record["id"] != 999
    assert record["created_at"] != "ignore"
    assert record["modified_by"] != "ignore"

def test_cp_post_busy(api, client_ids, as_user, write_blocker2):
    client_id = client_ids[0]
    write_blocker2()
    response = api.post("/crop-plan", json=post_request_body(client_id=client_id))
    assert_errors(response, 503, "SERVICE_BUSY")

def test_cp_post_db_failure(api_no_raise, client_ids, as_user):
    client_id = client_ids[0]
    response = api_no_raise.post("/crop-plan", json=post_request_body(client_id=client_id))
    assert response.status_code == 500

def test_cp_post_normal_then_get(api, client_ids, as_user):
    client_id = client_ids[0]
    response = api.post("/crop-plan", 
                        json={
                            "client_id": client_id,
                            "forecast_year": 2026,
                            "crop_id": 1,
                            "revision_id": 1,
                            "category_key": "unit_price",
                            "value": 80,
                            "memo": "test1"
                        })
    assert response.status_code == 201, response.text 
    response = api.get(f"/crop-plan/{client_id}/2026")
    assert response.status_code == 200, response.text 
    records = response.json()
    assert len(records) == 1
    record = records[0]
    assert record["id"] > 0
    assert record["client_id"] == client_id
    assert record["forecast_year"] == 2026
    assert record["crop_id"] == 1
    assert record["revision_id"] == 1
    assert record["category_key"] == "unit_price"
    assert record["value"] == 80
    assert record["memo"] == "test1"
    assert record["modified_by"] == "Override User"