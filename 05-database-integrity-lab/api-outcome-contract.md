# Client CRUD — API Outcome Contract

**Lab:** `04-http-contract-lab`  
**Status:** Experimental contract verified across HTTP, with simulated backend enforcement  
**Scope:** `GET /clients`, `POST /clients`, `PATCH /clients/{client_id}`, `DELETE /clients/{client_id}`

## 1. Contract principles

1. Backend/service owns business rules and actual mutation/commit correctness; HTTP communicates an outcome; the frontend adapter interprets recognized status/body pairs.
2. A recognized success is acknowledged only after the expected status and response structure are validated. HTTP error responses ordinarily resolve `fetch()`; the adapter must inspect them.
3. A **confirmed rejection** requires a recognized application code with a server guarantee of **no mutation committed for that operation**. Unknown or malformed responses are not automatically safe to retry.
4. The public error envelope for documented business rejections is:

   ```json
   { "detail": { "code": "DUPLICATE_CLIENT", "message": "A client with this name already exists." } }
   ```

5. API errors are standardized as `ApiError(type, code, message, options)`; underlying parsing/transport exceptions can be retained with `Error.cause`.
6. `type` is an outcome classification, **not** the UI recovery action. React maps recognized codes and operation context to a separate `recovery` value.
7. **Retry allowlist is empty in v1.** All uncertain mutation outcomes require reconciliation rather than automatic resubmission.

## 2. Shared response shapes

- **Client:** `{ "id": 3, "name": "Farm C", "modified_by": "Test User" }`. Adapter requires positive integer `id` and string `name`/`modified_by`.
- **Client list:** Array of valid client objects, including `[]`.
- **Edit success:** Valid client object with `id` equal to requested `client_id`.
- **Delete success:** HTTP `204` with no response body; do not parse JSON on success.
- **Business error:** `{ "detail": { "code": "...", "message": "..." } }`; recognized only when status, code, and string message match expectations.

## 3. Outcome registry

**Registry columns:** Operation / scenario, enforcement, HTTP status, code, commit guarantee, frontend classification, recovery, verification.

| Operation / scenario | Enforcement or detection | HTTP | Application code | Commit guarantee | Adapter classification | UI recovery | Verification status |
|---|---|---|---|---|---|---|---|
| GET — valid list (including empty) | FastAPI response model + adapter list checks | `200` | — | Read only | Return client array | Normal display | HTTP/manual tested |
| GET — unreadable, invalid, unexpected | Adapter status/JSON/shape checks | Other / unavailable | `REFRESH_ERROR` (frontend) | Read only | `refresh` | Caller-specific `refresh` | Failure paths tested |
| Create — client created | Simulated append + FastAPI response model; adapter shape check | `201` | — | Simulated mutation complete when response sent | Return client | Refresh list | HTTP/manual tested |
| Create — duplicate normalized name | Simulated business outcome; DB UNIQUE **not yet implemented** | `409` | `DUPLICATE_CLIENT` | No mutation in rejection scenario | `non-retryable` | `return-to-draft` | Response handling tested; enforcement deferred |
| Create — whitespace-only/empty name | Service `strip()` check before append | `422` | `INVALID_CLIENT_NAME` | No mutation | `non-retryable` | `return-to-draft` | HTTP/manual tested |
| Edit — requested client updated | Simulated lookup/update; adapter validates client and matching ID | `200` | — | Simulated mutation complete when response sent | Return client | Refresh list | HTTP/manual tested |
| Edit — client missing | Simulated lookup / controlled outcome | `404` | `CLIENT_NOT_FOUND` | No mutation | `non-retryable` | `refresh` | HTTP/manual tested |
| Edit — duplicate normalized name | Simulated outcome; DB UNIQUE **not yet implemented** | `409` | `DUPLICATE_CLIENT` | No mutation in rejection scenario | `non-retryable` | `return-to-draft` | Response handling tested; enforcement deferred |
| Edit — whitespace-only/empty name | Service `strip()` check before update | `422` | `INVALID_CLIENT_NAME` | No mutation | `non-retryable` | `return-to-draft` | HTTP/manual tested |
| Delete — requested client removed | Simulated lookup/remove | `204` | — | Simulated deletion complete when response sent | Return `undefined` | Refresh list | HTTP/manual tested |
| Delete — client missing | Simulated lookup / controlled outcome | `404` | `CLIENT_NOT_FOUND` | No mutation | `non-retryable` | `refresh` | HTTP/manual tested |
| Delete — client referenced | Controlled simulated outcome; DB FK **not yet implemented** | `409` | `CLIENT_REFERENCED` | No mutation in rejection scenario | `non-retryable` | `return-to-table` | Response handling tested; enforcement deferred |
| Mutation — unexpected status/code, malformed body, network/CORS loss, inconsistent success | Adapter conservative fallback | Any unrecognized / no accessible response | `UNKNOWN_OUTCOME` (frontend) | **Unknown** | `unknown` | `refresh` | Failure paths tested |
| Mutation — confirmed-safe retryable rejection | Not defined | — | — | — | **Not supported** | `retry` **not enabled** | Explicitly deferred |

### `422` scope

The explicit `422 / INVALID_CLIENT_NAME` registry entry applies to the backend's custom whitespace-name rejection. FastAPI/Pydantic can also emit framework-generated `422` responses for malformed payloads or path parameters, typically with a different `detail` shape. The present mutation adapter does **not** assume all `422` responses are confirmed custom business rejections; an unrecognized shape is classified `unknown` conservatively. This is an intentional scope boundary, not a complete validation-error taxonomy.

### Commit guarantee caveat

The **no-commit** claims above are contracts for recognized rejection paths in this simulated backend. They are not independently verified durable/transactional guarantees. Lab 05 must demonstrate these invariants under real database constraints and transaction behavior. Likewise, a response that claims success is not proof that the backend modified *only* the intended row; backend correctness remains a separate responsibility.

## 4. Frontend recovery registry

| Recovery | Offered action | Result | Applies to |
|---|---|---|---|
| `return-to-draft` | Close | Clear error; preserve Add/Edit modal and draft | Local validation, `INVALID_CLIENT_NAME`, `DUPLICATE_CLIENT` |
| `return-to-table` | Close | Reset active workflow; return to table | `CLIENT_REFERENCED` |
| `refresh` | Refresh Client List | Reset stale context and fetch; on failure display refresh error | `CLIENT_NOT_FOUND`, unknown outcomes, GET failure |
| `retry` | None in v1 | **Not implemented** | Empty allowlist |

An unsupported recovery value conservatively maps to `refresh`; the UI exposes an administrative warning rather than silently treating it as dismissal. A fresh GET after stopping a still-pending mutation is **not** proof that the mutation will not commit afterward.

## 5. Refresh context and response interpretation

`refresh()` itself returns one of `succeeded`, `failed`, or `skipped` and does not choose user-facing messages. The caller supplies the context:

| Caller context | On failed read |
|---|---|
| Initial load | State that clients could not be loaded |
| After confirmed mutation success | Explicitly acknowledge the mutation succeeded but the list update failed |
| After Stop Waiting | Do **not** claim a mutation succeeded; it may still complete |
| After unknown mutation outcome | Explain that the mutation's outcome remains uncertain and reconciliation failed |

A skipped refresh is kept distinct from HTTP failure. Additional skipped-refresh UI handling is intentionally out of scope for the prototype due to current mutual-exclusion guards and schedule priorities.

## 6. Future enforcement/verification work

Lab 05: stable identity, normalized-key UNIQUE on INSERT/UPDATE, referenced-delete FK restriction, reliable `404`/`409` mapping, transactional no-partial-write guarantees, and concurrency/race behavior. Later: framework `422` harmonization, authentication, idempotency/explicit safe-retry rules, diagnostics, and automated regression coverage.