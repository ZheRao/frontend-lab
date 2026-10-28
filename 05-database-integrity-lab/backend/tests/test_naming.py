import pytest 
from app.services.naming import string_normalize

@pytest.mark.parametrize("raw, expected", [
    ("Farm A", "farm_a"),
    ("   FARM    a   ", "farm_a"),
    ("Farm\tA", "farm_a"),
    ("      ", "")
])
def test_string_normalize(raw, expected):
    assert string_normalize(raw) == expected