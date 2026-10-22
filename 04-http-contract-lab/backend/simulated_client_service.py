import time

db = [
    {'id': 1, 'name': 'Farm A', 'modified_by': 'Alex'},
    {'id': 2, 'name': 'Farm B', 'modified_by': 'Bob'}
]

def id_generator(start: int=3):
    next_id = start 
    while True:
        yield next_id 
        next_id += 1

def client_list(success: bool = True) -> list[dict[str,str|int]]|None:
    if success:
        return db.copy()

ids = id_generator()

def append_client(name: str, outcome: str="normal") -> dict|None:
    # time.sleep(15)
    if outcome == "normal":
        new_client = {
            "id": next(ids),
            "name": name,
            "modified_by": "Test User"
        }
        db.append(new_client)
        return {
            "outcome": "created",
            "result": new_client
        }
    elif outcome == "duplicated":
        return {
            "outcome": "duplicated"
        }

def modify_client(client_id: int, name: str, outcome: str="normal") -> dict|None:
    search_success = False 
    client_idx = -1
    for i in range(len(db)):
        client = db[i]
        if client.get("id", -1) == client_id:
            search_success = True 
            client_idx = i
    if (outcome == "normal") or (outcome == "not_found"):
        if search_success and (outcome == "normal"):
            db[client_idx]["name"] = name
            return {
                "outcome": "updated",
                "result": db[client_idx]
            }
        else:
            return {
                "outcome": "not_found"
            }
    elif (outcome == "duplicated"):
        return {
            "outcome": "duplicated"
        }

def remove_client(client_id: int, outcome: str="normal") -> dict|None:
    search_success = False 
    target_client = {}
    for i in range(len(db)):
        client = db[i]
        if client.get("id", -1) == client_id:
            search_success = True 
            target_client = client
    if (outcome == "normal") or (outcome == "not_found"):
        if search_success and (outcome == "normal"):
            db.remove(target_client)
            return {
                "outcome": "deleted"
            }
        else:
            return {
                "outcome": "not_found"
            }
    elif outcome == "referenced":
        return {
            "outcome": "referenced"
        }