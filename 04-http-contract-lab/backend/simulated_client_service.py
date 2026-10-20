

def simulate_create_client(name: str):
    outcome = "successful"

    if outcome == "successful":
        return {
            "outcome": "created",
            "client": {
                "id": 3,
                "name": name,
                "modified_by": "Test User"
            }
        }
    elif outcome == "duplicate_client_detected":
        return {
            "outcome": "duplicate_client"
        }
    