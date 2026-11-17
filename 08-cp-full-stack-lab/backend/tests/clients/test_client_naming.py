# tests/clients/test_client_naming.py

import pytest 
from app.clients.naming import string_normalize

@pytest.mark.parametrize("raw, expected", [
    ("Farm A", "farm_a"),
    ("   FARM    a   ", "farm_a"),
    ("Farm\tA", "farm_a"),
    ("      ", "")
])
def test_string_normalize(raw, expected):
    assert string_normalize(raw) == expected