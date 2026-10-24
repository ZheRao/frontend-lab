# Client UI — HTTP Error and Recovery Boundary

**Implementation note:** Lab 04 (October 2026)  
**Applies to:** React `App.jsx`, `ErrorDialog.jsx`, `clientApi.js`, and shared `ApiError`.

## The three separate decisions

### 1. API classification — *What do we know?*

`clientApi.js` interprets HTTP status/body pairs and throws `ApiError` with `type`, `code`, `message`, and optional `cause`:

- `non-retryable`: A **recognized server rejection** with an explicit no-commit guarantee (e.g., `DUPLICATE_CLIENT`, `CLIENT_NOT_FOUND`, `CLIENT_REFERENCED`, `INVALID_CLIENT_NAME`).
- `unknown`: Mutation outcome cannot be established from available evidence, including transport failure or an unrecognized/inconsistent response. Do **not** automatically resend.
- `refresh`: The GET/list read failed; it is not a mutation outcome.

This layer should not choose which dialog appears or what happens after its action button is pressed. User-visible text is not used to determine retry safety. Underlying exceptions can be preserved as `Error.cause` for diagnostics.

### 2. Workflow recovery — *What may the user do next?*

React maps trusted application codes and context to `error.recovery`, **independent of** `error.type`:

| Code / condition | Recovery | Effect |
|---|---|---|
| Local invalid name, `INVALID_CLIENT_NAME`, `DUPLICATE_CLIENT` | `return-to-draft` | Error closes; preserve draft for correction |
| `CLIENT_REFERENCED` | `return-to-table` | Reset workflow; do not return to futile Delete confirmation |
| `CLIENT_NOT_FOUND` | `refresh` | Discard stale selection and retrieve current list |
| Unknown outcome or read failure | `refresh` | Reconcile from GET without automatically repeating mutation |
| Future safe retry | None enabled | No retry allowlist in v1 |

`ErrorDialog` renders its action label from the **same effective recovery** that `handleErrorRecovery()` executes. The native dialog prevents Escape dismissal; permitted action flows through React so DOM close and state transitions remain aligned. Unsupported recovery values default conservatively to refresh with an administrative warning.

### 3. Refresh context — *What did we know before attempting GET?*

`refresh()` fetches a validated list, updates clients on success, and returns `succeeded`, `failed`, or `skipped`. It **does not** set an error message. The caller owns the interpretation:

- **Initial load failure:** "Client list could not load."
- **After confirmed mutation:** "Your change succeeded, but the updated list could not be retrieved."
- **After Stop Waiting:** "The earlier operation may still complete; reconciliation failed." Never state that the operation was accepted.
- **After an unknown outcome:** "The operation might have committed; its status could not be reconciled."

A confirmed mutation followed by failed GET must **not** cause that mutation to run again. A GET immediately after Stop Waiting may return before the outstanding mutation eventually commits.

## Implementation sketch

```text
Request -> clientApi.js
    |-- recognized success -> App.runWrite -> refresh -> caller-specific result
    |-- recognized rejection -> ApiError(type, code) -> recoveryForError(code)
    `-- unknown/unexpected -> ApiError(unknown) -> recovery(refresh)

ErrorDialog(actionLabel from recovery) -> handleErrorRecovery(recovery)
```

The existing request lock and request-generation guard remain responsible for duplicate-submission prevention and ignoring stale responses after Stop Waiting. Generation guards do **not** cancel backend mutations.

## Scope decisions and limitations

- `retry` is intentionally absent from v1. No business outcome is currently allowlisted for automatic mutation retry.
- `refresh()` explicitly distinguishes skipped reads from failed reads. More elaborate skipped-refresh handling is deferred under existing lock/flow assumptions.
- Recovery dialog behavior during a recovery GET may be refined later; it was manually exercised without an observed blocking fault and is not a launch requirement.
- The simulated backend does not prove database uniqueness, foreign-key restrictions, durability, or transaction atomicity; these belong to Lab 05.

**Guiding rule:** *Classification describes evidence; recovery defines permitted action; caller context determines the truth of the refresh message.*