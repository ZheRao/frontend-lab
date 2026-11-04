```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, routes: HTTP only
│   ├── schemas.py              # Pydantic request/response models
│   ├── config.py               # DB path, busy timeout (read from env vars)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── client_service.py   # create/update/delete/list: validation, unit of work, outcomes
│   │   └── naming.py           # string_normalize and other name rules
│   └── db/
│       ├── __init__.py
│       ├── errors.py           # neutral kinds (unique, foreign_key, busy, …): portable
│       ├── sqlite_connection.py  # get_connection(), unit_of_work()   [SQLite-specific]
│       ├── sqlite_errors.py    # translate driver exception → neutral kind   [SQLite-specific]
│       └── schema.sql          # DDL
├── scripts/
│   └── init_db.py              # creates a fresh database from schema.sql
├── tests/
│   ├── test_naming.py          # pure functions, no database
│   ├── test_client_service.py  # service against a temporary file database
│   └── test_api.py             # routes through FastAPI's TestClient
├── notebooks/                  # experiments A–G and schema exploration, kept as a record
└── requirements.txt
```