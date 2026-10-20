# API Outcome Contract — Lab 04

**Status:** Experimental / evolving  
**Scope:** Client CRUD mutations between React and FastAPI

## 1. Governing Principles

- **Backend:** Owns business invariants, transaction correctness, and commit guarantees.
- **HTTP:** Communicates standardized outcome categories through status codes.
- **API contract:** Defines stable machine-readable outcomes independent of database technology.
- **Frontend adapter:** Translates recognized HTTP/API responses into application outcomes.
- **Conservative fallback:** Missing, malformed, ambiguous, or unrecognized mutation responses are classified as **unknown**, never automatically retryable.

A successful HTTP response alone does not independently prove a database commit. The backend must uphold the documented commit guarantee.

## 2. Outcome Definition Template

Each new scenario should document:

| Field | Definition |
|---|---|
| Operation | HTTP method and endpoint |
| Scenario / invariant | Business condition |
| Enforcement | Mechanism guaranteeing the invariant |
| Detection | How the backend identifies the outcome |
| HTTP status | Standard HTTP status code |
| Application code | Stable machine-readable identifier, if required |
| Commit guarantee | Committed / Not committed / Unknown |
| User message | Human-readable explanation |
| Frontend action | Refresh / Correct input / Retry / Reconcile |
| Verification | Test or evidence supporting the guarantee |

**Rule:** Add scenarios incrementally. Do not assume enforcement or commit guarantees without verification.

## 3. Initial Outcome Registry

| Operation | Scenario | HTTP | Code | Commit guarantee | Frontend action |
|---|---|---|---|---|---|
| POST /clients | Client created | 201 | Optional | Committed | Refresh clients |
| POST /clients | Duplicate normalized name | 409 | `DUPLICATE_CLIENT` | Not committed | Preserve draft; show error |

**Pending Lab 05:** Verify database uniqueness enforcement, exception detection, transaction behavior, and corresponding guarantees.

## 4. Frontend Outcome Classification

| Classification | Required evidence | Behavior |
|---|---|---|
| `success` | Recognized response with confirmed commit guarantee | Refresh |
| `rejected` | Recognized rejection with confirmed non-commit | Preserve draft; show reason |
| `retryable` | Recognized, allowlisted rejection explicitly guaranteeing non-commit and safe retry | Permit Retry |
| `unknown` | Insufficient or ambiguous evidence | No mutation retry; reconcile/refresh |

**Important:** HTTP status alone does not establish retry safety. Human-readable messages must never determine retry eligibility.

## 5. Evolution Rules

- Extend this registry when new scenarios or restrictions are discovered.
- Keep database-specific exceptions and constraint handling behind the backend API boundary.
- Preserve stable application codes across database implementations.
- Verify each outcome against actual backend behavior before treating its guarantees as production-ready.
- Document material contract changes in the project's decision history.