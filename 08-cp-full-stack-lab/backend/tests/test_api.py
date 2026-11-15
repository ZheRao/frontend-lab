import sqlite3 
import pytest 
from fastapi.testclient import TestClient 

from main import app 
from tests.helpers import committed_names
from app.db.sqlite_connection import unit_of_work


#   --- helpers ----------------------------------------
def create(api, name):
    """Create a client through the API and return its JSON body."""
    response = api.post("/clients", json={"name":name})
    assert response.status_code == 201, response.text 
    return response.json()

def assert_error(response, status, code):
    """Assert the response matches the error envelop the frontend adapter validates."""
    assert response.status_code == status, response.text
    detail = response.json()["detail"]
    assert detail["code"] == code 
    assert isinstance(detail["message"], str) 


#   --- GET /clients    ------------------------------------
def test_get_empty_list(api):
    response = api.get("/clients")
    assert response.status_code == 200, response.text
    assert response.json() == []

def test_get_unknown_is_500(api_no_raise):
    response = api_no_raise.get("/clients")
    assert response.status_code == 500, response.text

def test_get_after_create(api):
    client = create(api, "Farm A")
    response = api.get("/clients")
    assert response.status_code == 200, response.text
    assert response.json() == [client]

#   --- POST /clients   -------------------------------------
def test_post_created(api):
    response = create(api, "Farm A")
    assert set(response.keys()) == {"id", "name", "modified_by"}
    assert response.get("name", "") == "Farm A"

def test_post_duplicate(api, db_path):
    create(api, "Farm A")
    response = api.post('/clients', json={"name": "FARM     a"})
    assert_error(response, 409, "DUPLICATE_CLIENT")
    assert committed_names(db_path) == ["Farm A"]

def test_post_whitespace_only(api, db_path):
    response = api.post('/clients', json={"name": "         "})
    assert_error(response, 422, "INVALID_CLIENT_NAME")
    assert committed_names(db_path) == []

def test_post_busy(api, write_blocker, db_path):
    response = api.post('/clients', json={"name": "Farm A"})
    assert_error(response, 503, "SERVICE_BUSY")
    assert committed_names(db_path) == []

def test_post_unknown_is_500(api_no_raise):
    response = api_no_raise.post('/clients', json={"name": "Farm A"})
    assert response.status_code == 500, response.text

#   --- PATCH /clients/{id} --------------------------------------------

def test_patch_updated(api, db_path):
    response = create(api, "Farm A")
    client_id = response["id"]
    response_patch = api.patch(f'/clients/{client_id}', json={"name": "Farm Z"})
    assert response_patch.status_code == 200, response_patch.text
    response_body = response_patch.json()
    assert response_body["id"] == client_id 
    assert response_body["name"] == "Farm Z"
    assert committed_names(db_path) == ["Farm Z"]

def test_patch_not_found(api):
    response = api.patch('/clients/999', json={"name":"non-existence"})
    assert_error(response, 404, "CLIENT_NOT_FOUND")

def test_patch_duplicated(api, db_path):
    create(api, "Farm A")
    response_b = create(api, "Farm B")
    b_id = response_b["id"]
    response_patch = api.patch(f'/clients/{b_id}', json={"name": "Farm A"})
    assert_error(response_patch, 409, "DUPLICATE_CLIENT")
    assert committed_names(db_path) == ["Farm A", "Farm B"]

def test_patch_whitspace_only(api, db_path):
    response = create(api, "Farm A")
    a_id = response["id"]
    response_patch = api.patch(f'/clients/{a_id}', json={"name": "  "})
    assert_error(response_patch, 422, "INVALID_CLIENT_NAME")

def test_patch_busy(api, write_blocker2, db_path):
    client_id = create(api, "Farm A")["id"]     # no lock yet
    write_blocker2()                            # now the write lock is held
    response = api.patch(f"/clients/{client_id}", json={"name": "Farm Z"})
    assert_error(response, 503, "SERVICE_BUSY")
    assert committed_names(db_path) == ["Farm A"]

#   --- DELETE /clients/{id}    -------------------------------------------------

def test_delete_deleted(api, db_path):
    a_id = create(api, "Farm A")["id"]
    response = api.delete(f'/clients/{a_id}')
    assert response.status_code == 204, response.text
    assert response.content == b""
    assert committed_names(db_path) == []

def test_delete_not_found(api):
    response = api.delete('/clients/999')
    assert_error(response, 404, "CLIENT_NOT_FOUND")

def test_delete_referenced(api, db_path):
    a_id = create(api, "Farm A")["id"]
    with unit_of_work(db_path) as conn:
        conn.execute("INSERT INTO client_note (client_id, note) VALUES (?, ?)", (a_id, "Test"))
    response = api.delete(f'/clients/{a_id}')
    assert_error(response, 409, "CLIENT_REFERENCED")
    assert committed_names(db_path) == ["Farm A"]

def test_delete_busy(api, write_blocker):
    response = api.delete('/clients/1')
    assert_error(response, 503, "SERVICE_BUSY")