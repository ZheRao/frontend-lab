# tests/forecast_years/test_forecast_year_api.py





#   --- GET /forecast-years ---------------------------------

def test_get_forecast_year_pre_seeded_records(api):
    response = api.get("/forecast-years")
    assert response.status_code == 200, response.text 
    results = response.json()
    assert [r["forecast_year"] for r in results] == [2026, 2027, 2028, 2029]

def test_get_forecast_year_all_cols_included(api):
    response = api.get("/forecast-years")
    assert response.status_code == 200, response.text 
    results = response.json()
    keys = ["forecast_year", "modified_by", "modified_at"]
    for result in results:
        assert set(result.keys()) == set(keys)

def test_get_forecast_year_db_failure_is_500(api_no_raise):
    response = api_no_raise.get("/forecast-years")
    assert response.status_code == 500, response.text 
