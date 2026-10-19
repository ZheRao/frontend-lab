# 03 — Async Request Lab

**Status:** Completed (prototype experiment)  
**Scope:** Client CRUD asynchronous request lifecycle, authoritative refresh, and abandoned-request handling.

## Objective

Extend the state model established in `02-ui-state-lab` to handle asynchronous Add, Edit, and Delete operations against a simulated backend. Verify that request outcomes, loading, errors, and long waits do not violate the client CRUD interaction contract.

This lab tests *frontend coordination*, not production HTTP infrastructure.

## What was implemented

- Simulated backend owns the client records and exposes asynchronous create, edit, delete, and list operations.
- Initial client-list load blocks modification until an authoritative read succeeds.
- Add/Edit/Delete submissions share a `runWrite(action)` coordinator.
- A mutation submission lock (`requestLock`) prevents duplicate requests; a separate refresh lock (`refreshLock`) prevents overlapping refreshes.
- A successful mutation is followed by an authoritative list refresh **before** success is reported.
- Mutation errors show retryable feedback and preserve the active workflow and draft.
- Refresh errors show a non-dismissible error requiring a manual browser reload.
- A five-second observation timer offers **Keep Waiting** or **Stop Waiting & Refresh** for unresolved mutations.
- A request generation counter prevents abandoned results from controlling subsequent workflow state.
- If an abandoned mutation later resolves successfully, a non-blocking, auto-dismissing notice informs the user. A stale rejection is ignored.

## Key React and JavaScript concepts

| Mechanism | Purpose |
|---|---|
| `useState` | Client records, workflow, draft, request status, loading, error, long-wait choices, and notice |
| `useRef` | Synchronous request/refresh locks and request generation counter |
| `useEffect` | Initial load, Escape restrictions, observation timer, and notice timer/popover lifecycle |
| `async` / `await` | Sequence mutation and authoritative refresh |
| `try` / `catch` / `finally` | Distinguish successful operations, failures, and cleanup |
| Functional state update | Restart the five-second observation cycle |
| Native `<dialog>` | Blocking workflow, pending, success, and error interactions |
| Manual popover | Non-modal late-success notification |

## Behavioral paths verified

1. **Initial load succeeds:** Client list becomes available; modification controls become usable.
2. **Initial load fails:** A non-dismissible error instructs the user to reload; Escape dismissal is blocked.
3. **Enter and cancel:** Draft, selected client, workflow, and error are reset; no write or refresh is triggered.
4. **Mutation succeeds + refresh succeeds:** Updated authoritative records are shown before the success state; workflow resets afterward.
5. **Mutation fails:** Retryable error appears; dismissing it preserves the draft for retry or cancellation.
6. **Mutation succeeds + refresh fails:** A blocking error explains that the write succeeded but the list could not be retrieved; manual reload is required.
7. **Long wait → Keep Waiting:** Starts another five-second observation cycle without resubmitting the mutation.
8. **Long wait → Stop Waiting & Refresh:** Releases the frontend mutation lock, invalidates the old generation, resets the workflow, and requests an authoritative read.
9. **Abandoned mutation later succeeds:** Shows a non-blocking notice suggesting a convenient manual refresh; does not change the active workflow.
10. **Abandoned mutation later rejects:** No notice and no changes to the current workflow.

## Implementation notes

- `isLoading` begins as `true` to prevent an interactive initial render before the first read.
- `isSystemBusy` is derived from mutation pending, loading, or a present error; it is not a separate stored state.
- Processing and Loading use distinct visibility conditions so they do not intentionally present two pending dialogs at once.
- The long-wait timer is inactive during authoritative refresh.
- `refresh()` returns a Boolean to distinguish a successful read from a failed one. Its caller reports overall success only when the write **and** refresh succeed.
- Generation checks are performed after asynchronous boundaries. A stale successful write may emit a notice, but cannot complete the old workflow or release a newer request's lock.
- The Stop Waiting warning explicitly says the underlying operation is **not cancelled** and that a later notice is conditional on receiving a response.

## Limitations / deferred work

- Fake API timing and errors are controlled simulations, not real network or server behavior.
- **Stop Waiting is frontend abandonment, not server cancellation.** No `AbortController` integration is implemented.
- A backend operation may commit without the page ever receiving a response; a late-success notice is therefore best-effort, not guaranteed.
- Automatic background reconciliation of late successes is deliberately omitted to avoid interrupting an active workflow.
- HTTP error classification, authentication, server-side validation, database uniqueness/constraints, and production retry strategy are outside this experiment.
- The initial-load/required-refresh failure policy intentionally requires a browser reload; in-app retry can be considered later.
- Refresh-failure messages should be checked against the calling context during production integration: an abandonment-triggered read is not proof that the abandoned write succeeded.

## Exit criteria

The bounded experiment is complete once the above paths are exercised and the code reflects the documented invariants. Do not expand the lab into a general-purpose request framework; transfer the verified model into Strata's actual Client CRUD implementation and revisit deferred issues only when the real integration requires them.