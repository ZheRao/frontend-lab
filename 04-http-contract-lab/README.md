# 04 — HTTP Contract Lab

**Status:** Complete (October 2026)  
**Engineering question:** How can the frontend reliably interpret backend mutation outcomes?  
**Reusable outcome:** A thin HTTP API adapter, explicit response/error contracts, and context-aware UI recovery.  
**Experimental substitute:** Minimal FastAPI routes with a shared in-memory Python client store; no actual database.

## 1. Objective and boundary

Connect the existing React Client CRUD state machine to real HTTP operations **without rewriting its workflow logic**. Establish what the frontend can safely infer from a response, how it represents uncertainty, and what recovery action is appropriate. This lab tests communication and interpretation, **not** durability or database enforcement.

The experiment extends Lab 03's state model, request lock, request-generation checks, long-wait options, modal boundaries, and refresh-after-mutation behavior.

## 2. Architecture

```text
React App.jsx (workflow, pending/error/success, recovery)
    |
    v
clientApi.js (fetch, response checks, ApiError classification)
    |
    v
FastAPI main.py (HTTP routes/statuses, error envelope)
    |
    v
simulated_client_service.py (controlled outcomes + in-memory list)
```

The backend and GET endpoint share one transient client list, so a confirmed Create/Edit/Delete is visible to subsequent GET requests in the normal single-process experiment. Browser reload does not reset this list; backend process restart does.

**HTTP operations**

| Operation | Endpoint | Confirmed success | Success representation |
|---|---|---|---|
| List | `GET /clients` | `200` | Array of clients (may be empty) |
| Create | `POST /clients` | `201` | Created client |
| Edit | `PATCH /clients/{client_id}` | `200` | Updated client |
| Delete | `DELETE /clients/{client_id}` | `204` | No body |

A client response contains positive integer `id`, string `name`, and string `modified_by`. Edit additionally checks that the response ID matches the requested ID. The adapter only acknowledges recognized, structurally valid successes.

See [`api-outcome-contract.md`](api-outcome-contract.md) for the operation registry.

## 3. Implementation decisions

- **Backend owns mutations:** FastAPI routes translate service outcomes into documented HTTP statuses/application codes. The simulated service owns temporary in-memory changes, not database guarantees.
- **Adapter owns interpretation:** `clientApi.js` returns validated values for confirmed success; otherwise throws standardized `ApiError` instances. It never infers success merely because `fetch()` resolved.
- **Error class:** `ApiError` carries `type`, `code`, `message`, and optional standard `Error.cause`. The cause preserves network/JSON diagnostics while the UI consumes stable classifications.
- **Conservative uncertainty:** Transport/CORS failures, malformed/unrecognized responses, unexpected status/code combinations, and response-contract violations yield `unknown` mutation outcomes. An unknown outcome is *not* a confirmed failure and cannot be automatically retried.
- **Server-side name rule:** Empty/whitespace-only names are rejected before mutation; the documented application rejection is `422 / INVALID_CLIENT_NAME`. Name normalization/uniqueness are separate future database-invariant work.
- **No mutation retry in v1:** No outcome is currently allowlisted as confirmed-safe retryable. Manual resubmission after changing a draft is a new user action, not an automatic retry.
- **Recovery is not classification:** `ApiError.type` says what is known; the React error state's `recovery` says what the user may do. Specific error codes determine recovery policy.
- **Refresh does not decide its own message:** `refresh()` returns `succeeded`, `failed`, or `skipped`; the caller knows whether the GET followed initial load, confirmed mutation success, Stop Waiting, or uncertain mutation outcome.
- **Temporary tradeoffs:** A refresh lock prevents overlapping reads; `skipped` remains an explicit outcome but deliberately does not get additional UI machinery in the initial prototype. The recovery dialog may close while a recovery GET runs; further dialog/busy-state refinement is documented as optional, not a release prerequisite.

## 4. Recovery behavior

| Error/circumstance | Recovery | UI action |
|---|---|---|
| Frontend validation; `INVALID_CLIENT_NAME`; `DUPLICATE_CLIENT` | `return-to-draft` | Close error and preserve Add/Edit draft |
| `CLIENT_REFERENCED` | `return-to-table` | Close confirmation and return to table |
| `CLIENT_NOT_FOUND` | `refresh` | Discard stale selection and fetch clients |
| Unknown mutation outcome | `refresh` | Reconcile from GET; do not automatically repeat mutation |
| Initial/post-success/post-abandon refresh failure | `refresh` | Show context-accurate message and offer another read |
| Unexpected/unsupported recovery value | Conservative `refresh` fallback | Show administrative warning and avoid unlocking unsafe mutation |
| Confirmed-safe retry | **Not supported in v1** | No retry action allowlist |

The native `<dialog>` blocks Escape; its action delegates to React's recovery handler. The action label is derived from the same effective recovery policy that controls the action.

**Stop Waiting** releases the frontend's waiting workflow, **not** the server mutation. A subsequent GET may finish before the prior mutation. The UI warns about that and uses generation checks to avoid applying stale results. A fresh list is not proof that a still-running mutation cannot commit later.

## 5. Verification performed

The experiment used Swagger for backend routes and independently written browser-console calls for adapter behavior, then exercised the React integration. Scenarios tested across development included:

- Normal GET, Create, Edit, Delete; subsequent GET reflecting temporary in-memory state.
- Recognized business rejections (`404`, `409`, and custom `422`) with machine-readable codes.
- Empty client list and missing client ID; invalid whitespace-only name; malformed/inconsistent successful responses.
- Network/server-unavailable failures, unexpected statuses, invalid JSON, and conservative unknown classification.
- Slow mutation, Keep Waiting, Stop Waiting & Refresh, late completion notice, and request-generation guards.
- Failure to retrieve clients after initial load, confirmed success, and abandoned/uncertain operation, with caller-specific messages.
- Code-specific recovery paths and their dialog actions.

These are **manual experimental checks**, not an automated regression suite. Controlled error outcomes do not demonstrate genuine DB constraint enforcement.

## 6. Explicit limitations and deferred work

- The shared store is process-local, non-durable, non-transactional, and not a concurrency-safe database substitute.
- Duplicate-name and referenced-delete rejection scenarios are simulated; there is no database UNIQUE or FK enforcement yet.
- Framework-generated Pydantic `422` validation responses may differ from the custom `INVALID_CLIENT_NAME` envelope; unrecognized shapes are handled conservatively.
- Real authorization, persistence, transactions, backend concurrency guarantees, idempotency, automated tests, and production deployment remain out of scope.
- Optional recovery-dialog busy-state refinements and richer diagnostics are deferred in favor of the usable core platform.

## 7. Handoff

**Next:** `05-database-integrity-lab` — replace simulated list operations with a small SQLite client/dependent-record schema and verify stable IDs, normalized uniqueness, restrictive references, transaction behavior, and durable enforcement. Keep the external HTTP contract stable where practical; update the registry when a real enforcement/commit guarantee is verified.

**Related:** [`02-http-error-recovery.md`](02-http-error-recovery.md) explains the classification/recovery/refresh-context boundary. The cross-experiment governance remains `EXPERIMENT_ROADMAP.md` in the parent experiments project.