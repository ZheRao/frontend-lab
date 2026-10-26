# Lab 05 — Proposed implementation roadmap

1. Schema and database constraints

   Define what valid Client data looks like, independently of Python service logic.
2. Connection and unit-of-work helper

   Guarantee consistent connection configuration and controlled transaction boundaries.
3. SQLite error translation

   Convert recognized driver errors into database-neutral classifications.
4. Client CRUD service

   Implement actual database operations and interpret the neutral classifications in their business context.
5. FastAPI integration

   Connect the service to the existing HTTP contract and test the full backend.

I'd make these five stages, rather than four, because service correctness and HTTP integration deserve separate verification.

## Stage 1 — Schema and constraints

Start here

Question: Can the database protect the fundamental Client invariants, even when SQL statements bypass our Python service?

The proposed starting table is conceptually:

| Column              | Purpose                             | Guarantee                                                       |
| ------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `id`                | Immutable client identity           | Positive, unique, never automatically reassigned after deletion |
| `name`              | Human-readable display name         | Non-null, not entirely whitespace                               |
| `name_standardized` | Derived comparison key              | Deterministically normalized and unique                         |
| `modified_by`       | Existing API-compatible attribution | Stored with the record                                          |

The most interesting decision concerns `name_standardized`.

Your specification requires trimming, collapsing whitespace runs to underscores, and lowercasing, while preserving the display name.

SQLite doesn't natively provide the full specified normalization operation in a simple built-in expression. We therefore need to investigate whether to use an application-computed key with database constraints, a registered deterministic SQL function, or a different database-enforced approach.

I would make this the first design problem, and resist adding a larger schema until we resolve it.

Acceptance scenarios:

- Two equivalent normalized names cannot coexist.
- Updating a client to an existing normalized name fails.
- A whitespace-only name cannot be stored.
- Successful editing preserves the client ID.
- Deleting a client does not make its committed ID available for reassignment.

We can add the minimal dependent `client_notes` table toward the end of this stage to verify referential integrity.

## Stage 2 — Connection and unit of work

Question: How do we ensure that every database operation executes under the same connection and transaction guarantees?

I suggest two very small responsibilities:

`get_connection()` establishes a properly configured SQLite connection, including foreign-key enforcement.

`unit_of_work()` controls transaction completion and resource cleanup.

We already know from your experiments why these responsibilities matter.

The unit of work should establish:

- Successful operation → `commit()`.
- Failed operation → attempt `rollback()`.
- Connection always released.
- Unexpected database failures are not silently converted into business rejections.
- A failed rollback or ambiguous commit does not become a falsely confirmed non-commit.

One adjustment to your earlier documentation: a connection per service operation is a simpler initial rule than connection per HTTP request. For our current endpoints, those can coincide, but tying connection ownership to the service operation keeps the standalone tests straightforward.

Initially, test the helper with ordinary INSERTs and deliberately raised exceptions before introducing CRUD business logic.

## Stage 3 — SQLite-specific error translation

Question: How can the rest of our backend interpret database failures without understanding SQLite error codes?

I propose the narrow function you've described:

```
translate_sqlite_error(error) -> kind
```

Where `kind` is a small, controlled set:

| Neutral kind  | Meaning                                    |
| ------------- | ------------------------------------------ |
| `unique`      | Recognized uniqueness constraint violation |
| `foreign_key` | Recognized foreign-key violation           |
| `busy`        | Recognized database contention             |
| `unknown`     | Cannot safely classify                     |

There is one refinement I'd make: the classification should carry sufficient detail to avoid confusing a violation of the client-name uniqueness rule with a violation of some future unrelated unique constraint.

For example, an eventual audit table may have its own unique constraints. A generic `unique` result does not automatically mean `DUPLICATE_CLIENT`.

The translator should classify only what it can establish. The service interprets that classification in the context of the attempted operation.

And importantly, the translator should not issue commits, rollbacks, or HTTP responses.

That separation will make future database migration easier without prematurely building a database adapter framework.

## Stage 4 — Client CRUD service

Question: Can our service fulfill the same business intentions previously simulated in Lab 04, using real database operations?

This is where we'll replace the functionality in `simulated_client_service.py`.

I'd proceed one operation at a time.

| Order | Operation         | Critical verification                                              |
| ----- | ----------------- | ------------------------------------------------------------------ |
| 1     | `client_list()`   | Read committed records, return the expected shape                  |
| 2     | `append_client()` | Persist one client, return database-assigned ID, reject duplicates |
| 3     | `modify_client()` | Preserve ID, detect missing records, enforce uniqueness            |
| 4     | `remove_client()` | Delete unreferenced records, reject referenced deletion            |

I suggest retaining the business-outcome model established in Lab 04:

```
{"outcome": "created", "result": ...}{"outcome": "duplicated"}{"outcome": "not_found"}{"outcome": "referenced"}
```

This minimizes unnecessary changes to `main.py`.

But here's a subtle architectural point: the service should not treat all exceptions as business outcomes.

For example:

- Recognized client-name uniqueness violation → `duplicated`.
- UPDATE affects zero rows → `not_found`.
- Recognized foreign-key violation during client deletion → `referenced`.
- Unrecognized SQL error → propagate rather than inventing a business outcome.
- Confirmed non-commit from contention → potentially `busy`, under our agreed safety conditions.

The connection/transaction helper establishes transaction outcomes. The translator classifies database errors. The service determines business meaning.

These responsibilities remain separate even though they cooperate during the same operation.

## Stage 5 — FastAPI integration

Question: Can we swap the storage implementation while preserving the externally visible HTTP contract?

This should be relatively small because Lab 04 already established the routes and response models.

For example:

React / `clientApi.js`

Existing frontend, unchanged

FastAPI / `main.py`

HTTP outcomes and response models

Client service

Business operations and outcomes

SQLite infrastructure

Connections · transactions · error translation

SQLite database

Identity · constraints · persistence

We should verify persistence across backend restarts and test each confirmed business rejection through HTTP. Only after that would I reconnect the React frontend for a final manual check.

## One architectural caution

There's a possibility of overengineering the unit-of-work and translation layers.

For this lab, I'd keep them deliberately small. We don't need generic interfaces, dependency injection frameworks, an ORM, or a hierarchy of domain exceptions merely to create four CRUD functions.

However, I would establish one firm rule:

Database-specific knowledge should remain confined to the schema, connection setup, SQL operations, and error translation.

That doesn't mean we can swap SQLite for PostgreSQL by changing one function. SQL syntax and transaction behavior also differ. It means we're avoiding unnecessary database-specific assumptions in our business and HTTP contracts.
