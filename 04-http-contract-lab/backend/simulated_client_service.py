
db = [
    {'id': 1, 'name': 'Farm A', 'modified_by': 'Alex'},
    {'id': 2, 'name': 'Farm B', 'modified_by': 'Bob'}
]

def id_generator(start: int=3):
    next_id = start 
    while True:
        yield next_id 
        next_id += 1

def client_list():
    return db.copy()

ids = id_generator()

def append_client(name: str):
    outcome = "created"

    if outcome == "created":
        new_client = {
            "id": next(ids),
            "name": name,
            "modified_by": "Test User"
        }
        db.append(new_client)
        return {
                "outcome": outcome,
                "client": new_client
        }
    elif outcome == "duplicate_client":
        return {
            "outcome": outcome
        }

