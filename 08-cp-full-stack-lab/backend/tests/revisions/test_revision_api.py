# tests/revisions/test_revision_api.py

from tests.revisions.test_revision_service import SEEDED_REVISIONS, REVISION_FIELDS


#   --- GET /revisions  --------------------------------------------------------

def test_get_revisions_returns_seeded_revisions_in_order(api):
    response = api.get("/revisions")
    assert response.status_code == 200, response.text
    assert [(r["id"], r["name"], r["revision_order"]) for r in response.json()] == SEEDED_REVISIONS

def test_get_revisions_exact_field_set(api):
    response = api.get("/revisions")
    assert response.status_code == 200, response.text
    records = response.json()
    assert len(records) > 0
    for record in records:
        assert set(record.keys()) == REVISION_FIELDS

def test_get_revisions_db_failure_is_500(api_no_raise):
    response = api_no_raise.get("/revisions")
    assert response.status_code == 500, response.text