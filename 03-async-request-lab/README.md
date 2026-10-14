# 02 — UI State Lab

## Purpose

Explore the React state coordination required by Strata's Client CRUD interface before introducing real asynchronous requests, HTTP, or a database. This lab follows the Client CRUD specification and the overarching `EXPERIMENT_ROADMAP.md`; it is a learning prototype, not a production implementation.

## Scope and result

Implemented and manually tested the four mutually exclusive workflows (`view`, `add`, `edit`, `delete`), shared Add/Edit form, Delete confirmation, client-name validation, error overlay, and a simulated pending overlay with manually triggered success/failure outcomes.

The client list is held in local React state and seeded with sample records. Successful simulated requests **do not** mutate or refetch that list. No timers, Promises, network requests, persistence, or automated tests were introduced.

## State model

| State | Values / shape | Responsibility |
| --- | --- | --- |
| `workflow` | `'view' \| 'add' \| 'edit' \| 'delete'` | The single active operation |
| `request` | `'idle' \| 'pending'` | Whether a mutation outcome is unresolved |
| `error` | `null` or `{ type, title, message }` | Blocking error presentation; currently validation and simulated retryable failure |
| `clientId` | `null` or numeric ID | Target of Edit/Delete |
| `draft` | `null` or `{ name: string }` | Isolated Add/Edit working copy |
| `clients` | Array of client records | Local sample list |

Derived values such as `selectedClient`, `isPending`, `canSubmit`, and `canEnterAction` are calculated from state rather than stored independently.

### Core invariants

- Only one workflow can be active at once.
- `view`: no selected ID or draft; `add`: empty-name draft and no ID; `edit`: selected ID and a copy of the current name; `delete`: selected ID and no draft.
- A draft is never written into the client list merely by typing. Cancel discards the draft.
- A validation error blocks submission; no request starts for whitespace-only names.
- An unresolved request retains its workflow and draft; conflicting actions and user cancellation are guarded.
- Error dismissal retains the workflow and selected ID. **Lab-specific UX decision:** after a whitespace-only validation error, dismissing the error clears the name field to `''` so the user can type immediately. Other failures preserve the draft.
- Simulated success resets the workflow only after the explicit success action; simulated confirmed failure returns to idle and presents an error without discarding the draft.

## Component responsibilities

- `App`: owns authoritative state, guards, validation, and simulated outcome transitions.
- `ClientList` / `ClientRow`: render records and report the selected action/client upward.
- `ModifyClientModal`: shared controlled form for Add and Edit; does not decide the operation.
- `DeleteClientModal`: displays selected client's name and requests confirmation; Cancel receives initial focus.
- `PendingDialog`: displays a spinner and temporary simulation buttons.
- `ErrorDialog`: displays a structured blocking error above the underlying workflow modal.

Native `<dialog>` elements are opened and closed via refs and effects in response to React props. The close callbacks and reset operations were designed to be idempotent.

## Manual verification

Verified Add/Edit/Delete opening and cancellation, draft isolation across operations, validation overlay and recovery, selection of the correct Delete target, repeated Escape protection during pending, disabled controls, simulated failure with draft preservation, simulated success cleanup, and ability to begin a fresh workflow afterward.

## Browser behavior / known limitation

During testing with stacked native dialogs, repeated Escape presses could dismiss the pending dialog while React still reported `request === 'pending'`, leaving browser dialog state out of sync with application state. Preventing `cancel` on the dialog alone did not reliably resolve the observed behavior. The lab uses a **temporary, pending-scoped capture-phase `document` keydown listener** to prevent Escape, removed by effect cleanup when pending ends. This is an observed workaround, **not** a production-hardened modal strategy. Focus restoration, native close-request behavior, and stacked-dialog lifecycle need dedicated verification before reuse.

## Key lessons

1. Model orthogonal state dimensions rather than enumerating every UI combination.
2. Keep editable drafts separate from fetched records and identify mutation targets by stable ID.
3. Derive flags and selected records from authoritative state; do not duplicate them as state.
4. Use both disabled UI controls and guarded state transitions to enforce invariants.
5. Treat browser-owned dialog state and React-owned application state as distinct systems that must be synchronized.
6. Distinguish user confirmation, request submission, confirmed success, confirmed failure, and unknown outcomes.

## Next lab

`03` introduces actual asynchronous mechanics, submission snapshots, and request-outcome handling. API and database integration remain later experiments.