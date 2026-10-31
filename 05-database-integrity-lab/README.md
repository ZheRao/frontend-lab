# 05 — Database Integrity Lab

**Growlytics / Strata · Client CRUD experiments**  
**Completed:** October 31, 2026 (implementation, automated backend checks and reported manual frontend integration)

## Engineering question

**Which Client CRUD invariants must survive bypassing the UI, and how can the backend report trustworthy outcomes from a real relational database?**

## Starting point

Lab 04 used a FastAPI HTTP interface backed by an in-memory Python list, with simulated duplicate, missing-record, referenced-delete, and error outcomes. Those responses demonstrated contract interpretation but not persistence or database-enforced integrity.

## Experimental progression

1. **SQLite fundamentals (A–G):** file versus memory storage; transactions and read visibility; lock contention; primary-key reuse; statement versus transaction atomicity; uniqueness errors; FK enforcement and `ON DELETE RESTRICT`.
2. **Schema:** `clients(id INTEGER PRIMARY KEY AUTOINCREMENT, name, name_standardized UNIQUE, modified_by)` plus a minimal dependent `client_note` test table. Python normalizes names; SQLite enforces unique supplied keys.
3. **Connection and unit-of-work:** enable/verify SQLite foreign keys before starting a transaction; explicit commit, rollback attempt, and close. Learn why catching an exception inside a transaction scope can accidentally commit earlier statements.
4. **Driver-error translation:** classify actual SQLite exceptions into `DBErrorKind` without embedding SQLite codes in business responses.
5. **Service implementation:** `client_list`, `append_client`, `modify_client`, `remove_client`; use `INSERT/UPDATE/DELETE ... RETURNING` and commit before reporting success.
6. **FastAPI and React integration:** replace simulated service while preserving HTTP codes and error envelope; validate SQLite-backed routes with pytest/FastAPI TestClient and manually exercise the original React UI.

## Verified mechanisms

- Persisted client records and database-assigned, nonrecycled committed IDs under normal SQLite automatic assignment.
- Name normalization using trim, lowercase and whitespace-run replacement; uniqueness on the stored normalized key.
- Atomic mutation statements, explicit transaction completion, and rollback of preceding statements on propagated errors.
- Foreign keys enabled and verified on application connections; deletion of referenced clients is prohibited in tested scenarios.
- Service outcomes: `REFRESHED`, `CREATED`, `UPDATED`, `DELETED`, `DUPLICATED`, `INVALID_NAME`, `NOT_FOUND`, `REFERENCED`, `DATABASE_BUSY`, `UNKNOWN`.
- Preserved FastAPI contract: GET 200; POST 201; PATCH 200; DELETE 204; business rejections 404/409/422; busy 503; unexpected failure 500.

## Evidence

| Layer | Documented test cases | Notes |
|---|---:|---|
| Naming and database infrastructure | 13 | Earlier shared parametrized normalization, constraint/translator, and unit-of-work tests |
| Client CRUD service | 28 | Tests supplied in `test_client_service.py`, including parameterized cases |
| FastAPI HTTP contract | 17 | Supplied TestClient tests: GET 3, POST 5, PATCH 5, DELETE 4 |
| **Total** | **58** | Reported passed; not freshly executed for this README |

All HTTP tests use a temporary per-test SQLite database with the real lab schema. The developer reports manual frontend–backend–database functionality and persistence checks.

## Code and documentation navigation

Expected lab files (verify paths against current repository): `app/db/schema.sql`, `app/db/sqlite_connection.py`, `app/db/sqlite_errors.py`, `app/conventions.py`, `app/services/naming.py`, `app/services/client_service.py`, `main.py`, and `tests/`. See the experiment notebook/documentation for A–G and the Strata implementation reference `docs/implementations/client-crud/02-database-integrity-implementation.md` for details.

## Scope and accepted limitations

This is a bounded experimental implementation, not the entire Strata database or production readiness certification. Name/key consistency depends on application-controlled writes; a privileged direct SQL writer may supply an incorrect key. Full audit, authenticated identity, production migrations, logging/monitoring, automated browser tests, distributed/ambiguous-commit recovery and concurrency conflict resolution are deferred. The client service classifies busy and unknown errors but does not authorize automatic mutation retry based solely on that classification. Tests show currently observed outcomes, not universal guarantees for every possible infrastructure failure.

## Lessons learned

- A successful SQL statement is not equivalent to a committed transaction.
- A read helper must never roll back a transaction it does not own.
- Swallowed exceptions inside a context-managed unit of work can cause unintended commits.
- `NOT NULL` and `UNIQUE` protect supplied keys, not correctness of name normalization in arbitrary direct SQL.
- SQLite FK PRAGMA is per-connection and ineffective when enabled mid-transaction; verify it on connection initialization.
- The database reports error mechanics, the service interprets business meaning, FastAPI communicates contractual outcomes, and React selects recovery.
- An unknown result must never be described as confirmed failure or success.

## Completion and transfer

Core lab objective completed with SQLite services, automated backend/HTTP tests and manual UI integration. Candidate code must still be reviewed and retested inside the actual Strata deployment. Preserve material changes in Strata's append-only decision register and keep the business guarantee matrix synchronized with new tests.