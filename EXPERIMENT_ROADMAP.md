# Frontend & Full-Stack Learning Experiments — Roadmap

**Created:** 2026-10-11  
**Status:** Learning plan; experiments are independently scoped and may be adjusted as knowledge gaps become clearer.  
**Primary reference:** `01-client-crud.md` — Client CRUD Feature Specification and Acceptance Tests (v0.5, 2026-10-11).

## 1. Purpose and philosophy

These experiments exist to **close specific knowledge gaps before implementing the production-intended Client CRUD feature**. They are **not** exercises in engineering complete production applications, and they do **not** each need a full development SOP, a new exhaustive behavioral specification, deployment infrastructure, or polished visual design.

Use the already-agreed Client CRUD invariants and behavior as reference where applicable. Translate them into small, fictional domains to understand the underlying mechanisms. Do not reproduce the entire Client CRUD feature in every experiment.

**Learning loop:** identify the target mechanism → model or reason about it → implement the smallest useful example → deliberately test success/failure/edge cases → record key lessons → stop.

**Repository convention:** one Git repository containing independently runnable experiment directories. Keep `01-task-tracker` as a historical learning snapshot. Do not introduce shared application architecture or monorepo tooling without a concrete need. Each experiment may have its own dependencies and README.

## 2. Experiment overview

| Experiment | Central engineering question | Primary learning outcome |
| --- | --- | --- |
| `02-ui-state-lab` | How do interacting UI states coexist without contradictions? | State dimensions, ownership, transitions, modal layering, draft preservation and focus isolation |
| `03-async-request-lab` | How can a UI coordinate a request whose completion is delayed or uncertain? | Promise lifecycle, duplicate-submission guards, timeouts, local abandonment and stale-response protection |
| `04-http-contract-lab` | How does the frontend reliably interpret backend outcomes? | `fetch`, status handling, structured error codes, safe retry decisions and unknown-outcome classification |
| `05-database-integrity-lab` | Which invariants must the database enforce independently of the UI? | Normalized uniqueness, foreign keys, transaction atomicity and rollback |
| `06-behavior-testing-lab` | How can tests prove that intended behavior survives changes? | User-oriented React tests, controlled async tests, backend tests and selected integration tests |

## 3. `02-ui-state-lab` — Meeting Room Reservation Manager

**Purpose:** Understand UI state modeling and coordination without network or database complexity.

**Tiny project:** A fictional meeting-room reservation list with a New Reservation modal, inline Rename, and simulated pending/error overlays. Reservation data lives in React state; use fixed sample records. The domain is illustrative, not a real booking system.

**Practice:**
- Separate mutually exclusive editing contexts from independent overlay/request-status dimensions.
- Identify legal transitions and prevent impossible UI combinations.
- Decide state ownership between parent and child components; practice props, callbacks, mounting/unmounting and draft initialization.
- Preserve a draft when a validation/error dialog is dismissed; discard it on explicit cancellation or a permitted context switch.
- Keep one editing/action context active; prevent background interaction while a modal is topmost.
- Manage focus on modal opening, closing and restoration; preserve ordinary keyboard accessibility without custom shortcuts.
- Use a simple simulated pending state to understand visual blocking; leave real asynchronous lifecycle mechanics for Experiment 03.

**Relevant Client CRUD rules:** G-04 (UI exclusivity), G-06 (success reset), G-07 (draft preservation after confirmed rejection), G-11 (modal focus); basic G-05 behavior may be simulated. Relevant acceptance scenarios include Add/Rename context switching, validation errors, cancellation, and modal isolation.

**Done when:** You can explain the state model and component ownership, demonstrate switching editing contexts, preserve/discard drafts correctly, and show that only the topmost modal is interactive. No backend required.

**Not in scope:** Actual room availability, scheduling conflicts, authentication, HTTP, databases, production styling, or the full ten-second timeout protocol.

## 4. `03-async-request-lab` — Simulated Submission Console

**Purpose:** Understand a request lifecycle independently of transport details and real server behavior.

**Tiny project:** A console with one Submit action and a configurable fake asynchronous operation that succeeds, rejects, resolves late, or remains unresolved.

**Practice:**
- Promises, `async`/`await`, `try/catch/finally` and rendering pending state.
- Difference between `useState` (rendering) and `useRef` (synchronous coordination), including duplicate-submit prevention.
- Observe one request for ten seconds, then offer **Keep Waiting** or **Stop Waiting & Refresh**.
- Keep Waiting must observe the original operation, never start a second mutation.
- Stop Waiting abandons local observation; it does **not** imply server rollback.
- Track request identity or generation so a late completion cannot overwrite a newer view.
- Distinguish confirmed resolution from an unresolved/unknown outcome.

**Relevant Client CRUD rules:** G-05, G-08, and the ten-second policy in §8; AT-23 and AT-27–AT-32.

**Done when:** Repeated submissions trigger one operation, the timeout choices behave correctly, and abandoned late responses cannot corrupt the current UI.

**Not in scope:** Real FastAPI, network protocol details, durable idempotency, server-side cancellation or transaction rollback.

## 5. `04-http-contract-lab` — API Response Inspector

**Purpose:** Learn how a frontend and backend communicate outcomes through explicit, machine-readable contracts.

**Tiny project:** A minimal React interface talking to a small FastAPI service with deliberately controlled responses.

**Practice:**
- `fetch`, HTTP methods and statuses, JSON request/response bodies, and the distinction between an HTTP error response and a rejected `fetch` promise.
- Handle malformed/unexpected responses conservatively.
- Define stable error codes and explicit non-commit semantics in FastAPI.
- Distinguish success, validation rejection, duplicate-name rejection, allowlisted confirmed-safe transient failures, and unknown outcomes.
- Offer Retry only when the backend contract authoritatively establishes that the mutation did not commit and its error code is allowlisted.
- Preserve the draft on confirmed rejection; never infer retry safety from human-readable messages alone.

**Relevant Client CRUD rules:** G-07, G-08, §8 error classes, and §11 safe-retry decisions.

**Done when:** The UI chooses appropriate recovery actions from the response contract, not from error-message wording, and treats ambiguous outcomes as unknown rather than safe-to-retry.

**Not in scope:** A complete CRUD backend, authentication, database persistence, deployment, or solving distributed exactly-once execution.

## 6. `05-database-integrity-lab` — Client & Dependent Records

**Purpose:** Understand the integrity guarantees that must exist even if frontend validation is bypassed.

**Tiny project:** A small SQLite database with a `client` table and a second table referencing clients.

**Practice:**
- Primary keys and stable identity independent of editable display names.
- Derive a normalized comparison key: trim outer whitespace, collapse consecutive whitespace into one underscore, and lowercase; preserve the display name separately.
- Enforce `UNIQUE` on the normalized key for both INSERT and UPDATE.
- Enforce restrictive foreign keys; explicitly enable and verify SQLite foreign-key enforcement.
- Practice INSERT, UPDATE, DELETE, transactions, failure handling and rollback.
- Explore why a pre-insert frontend/backend existence check cannot replace database uniqueness.

**Relevant Client CRUD rules:** G-01–G-03, G-09; AT-34–AT-36; backend requirements in §10. Precise Unicode normalization edge behavior remains an implementation detail to decide consistently.

**Done when:** Duplicate normalized names fail on create and rename, referenced clients cannot be deleted, and failed transactions do not leave partial changes.

**Not in scope:** Full production schema, comprehensive audit system, authentication, or large-scale database performance tuning.

## 7. `06-behavior-testing-lab` — Regression Test Workshop

**Purpose:** Learn to test user-observable behavior and integrity guarantees rather than implementation details.

**Tiny project:** Primarily **add tests to selected earlier experiments**, rather than building another large application. Use a small standalone fixture only if a concept cannot be isolated otherwise.

**Practice:**
- Vitest and React Testing Library for interactions, forms, modal isolation and draft lifecycle.
- Controlled fake timers and mocked/deferred promises for pending, timeout and late-response cases.
- Assert request counts to catch duplicate submissions.
- Backend tests for FastAPI response contracts and error classification.
- Database tests for uniqueness, restrictive deletion and transaction rollback.
- A few integration tests connecting UI, API and database, when useful to expose boundary mistakes.

**Relevant Client CRUD rules:** Select representative cases from §9, especially AT-06–AT-07, AT-12–AT-15, AT-23–AT-32, and AT-34–AT-36.

**Done when:** Tests reliably fail for deliberately introduced regressions in draft preservation, duplicate submission, timeout/late response handling, response classification and database constraints.

**Not in scope:** Exhaustive end-to-end coverage, production CI/CD infrastructure, broad test-framework mastery or testing every feature in the full Strata platform.

## 8. Suggested order and boundaries

1. **02 — UI state:** Learn how to represent and coordinate what the user sees.
2. **03 — Async lifecycle:** Add uncertainty in time, without real HTTP.
3. **04 — HTTP contracts:** Replace fake outcomes with explicit frontend/backend communication.
4. **05 — Database integrity:** Enforce correctness below the API layer.
5. **06 — Behavioral testing:** Consolidate and automate representative behavior from earlier experiments.

This order is a learning scaffold, not a strict dependency graph. Testing can begin earlier where convenient. Do not add Redux, Zustand, TanStack Query, state-machine libraries, complex monorepo tooling, or production deployment just to complete these labs.

## 9. Completion discipline

For each experiment, keep a short README covering: **question explored; minimal implementation; key mechanisms understood; failure cases observed; remaining uncertainties**. Preserve the working code as a reference, then move on when the specific learning outcome is achieved. Avoid polishing, extending the business domain, or repeating the complete feature-development SOP.

**Handoff to Strata:** After the relevant gaps are closed, implement the real Client CRUD against its own authoritative specification and acceptance tests. The experiments teach mechanisms; they do not replace production feature decisions or verification.

# Appendix: Client CRUD — Feature Specification and Acceptance Tests

**Project:** Management Configuration  
**Feature:** Client reference-data management  
**Version:** 0.5 (identity lifecycle and normalization confirmed)  
**Date:** 2026-10-11  
**Status:** Proposed specification; decisions recorded below, remaining questions explicitly identified  
**Scope:** One bounded feature. Not a specification for the entire platform.

## 1. Purpose and boundaries

Provide a simple management workflow where a user enters a temporary self-declared name, views and searches clients, and creates, renames, or deletes client records. The feature prioritizes predictable behavior, data integrity, and understandable error recovery over advanced optimization.

### In scope

- Temporary session identity gate (name entry).
- Initial retrieval and display of clients in a table.
- Client-name search/filtering.
- Add Client modal, inline Rename, Delete confirmation modal.
- Blocking pending overlay, error dialogs, and long-request decision dialog.
- Single active editing context and single pending mutation per UI session.
- Database-backed uniqueness and referential integrity.
- Success reset, refresh, and failure recovery.
- Audit attribution requirements and acceptance tests.

### Out of scope for this development cycle

- Authentication, authorization, roles, and secure identity verification.
- Optimistic locking/version conflicts across users; last-write-wins is accepted.
- Similar-name/fuzzy duplicate detection (e.g., `ABC Farms` vs. `ABC Farm`).
- Pagination, advanced search optimization, and large-scale performance tuning.
- Server-side cancellation/transaction rollback on user request.
- Final table field selection and visual styling.
- Other configuration domains, forecast inputs, and engine integration.

## 2. Vocabulary

- **Session identity:** User-entered attribution name. Not authenticated.
- **Management workflow:** Client-management UI after the identity gate; distinct from session identity.
- **Draft:** Unsaved client name in Add or Rename.
- **Active editing context:** Exactly one Add modal or one inline Rename editor, or none. Delete confirmation is a modal action context.
- **Mutation:** Create, Rename, or Delete request to backend.
- **Confirmed success:** Backend response authoritatively indicates mutation committed.
- **Confirmed rejection:** Backend response establishes that mutation was not committed.
- **Unknown outcome:** No authoritative confirmation whether mutation committed (e.g., lost response or timeout).
- **Refresh:** Retrieve current client list and reset feature-level UI state; not necessarily a browser reload.
- **Modal popup:** Blocking overlay over the existing screen. Only its topmost layer accepts interaction.

## 3. Global invariants and contracts

**G-01 — Stable client identity.** Each client has an immutable numeric primary key (`client_id`). Renaming changes the display name, not the ID.

**G-02 — Name validity.** A client name is invalid only when it is empty or consists entirely of whitespace. A name with at least one non-whitespace character is syntactically valid. Duplicate-name rules are separate database-integrity rules. No other character restrictions are currently specified.

**G-03 — Uniqueness.** The database enforces uniqueness on a consistently derived normalized name key, on both INSERT and UPDATE. The confirmed normalization policy is to trim leading/trailing whitespace, replace each consecutive whitespace run with one underscore, and lowercase for comparison, while preserving the human-readable `client_name`. The key is a lookup/uniqueness key, not a second immutable identity.

**G-04 — UI exclusivity.** At most one editing/action context is active in a single management UI. Switching from an unsaved inline Rename to another available action discards the Rename draft. Modal overlays block background mouse and keyboard interactions.

**G-05 — Mutation exclusivity.** At most one mutation request is initiated and tracked as pending in one UI session. Pending controls are disabled; duplicate click/Enter submissions cannot initiate another request. A synchronous submission guard in addition to render-state disabling may be used.

**G-06 — Success reset.** Following confirmed mutation success, discard all feature-level drafts, filters, and dialogs, refetch clients, and return to the default table view. Preserve the session identity. Do not report full readiness until the refresh succeeds.

**G-07 — Failure preserves recoverable work.** A confirmed server rejection returns the user to the underlying Add or Rename context with its draft preserved after the error dialog is dismissed, except that an explicit Cancel of that editing context discards the draft.

**G-08 — Unknown outcomes are not failures.** Do not automatically retry a mutation when commit status is unknown. Show an uncertainty/reconciliation message and offer a fresh read. Refreshing does not guarantee that an in-flight backend operation cannot commit later.

**G-09 — Database referential integrity.** Deletion of a referenced client is rejected. Use restrictive foreign keys for ordinary relationships; triggers are reserved for additional rules requiring them. The API maps database errors into understandable messages.

**G-10 — Cross-session behavior.** The initial release accepts last-write-wins updates across different sessions. Database transaction locks may still serialize writes; they do not imply lost-update prevention. Audit history is for traceability, not verified proof of human identity.

**G-11 — Modal focus.** Only the topmost modal is interactive; background pointer actions, form submission, keyboard shortcuts, and focus movement must not activate underlying controls. Focus should return to a sensible surviving control on dismissal.

## 4. User entry and default management view

1. Before showing management controls, request a username.
2. Once a name is accepted, preserve it for the management session as an attribution label.
3. Fetch the client list from the backend.
4. Show the client table, a client-name search input, and **Add New Client** at top right.
5. Each row has an **Action** column with **Rename** and **Delete** controls. Remaining table columns are TBD.
6. Search filters the visible list as the user types. Initial implementation may filter the fetched list locally; exact matching behavior and data-volume assumptions should be recorded during implementation.
7. During initial loading and refresh, display an appropriate loading state; a failed list fetch displays a read/refresh error, never an empty list falsely presented as successful.

**Default management state:** Search empty; no edit mode; no active modal; no draft; current fetched list displayed; actions enabled.

**Identity boundary:** A successful CRUD mutation resets the management workflow, **not** the identity gate. Re-authentication is not required after each mutation.

## 5. Add New Client — behavioral contract

### Preconditions

- Identity gate completed and management interface available.
- No mutation currently pending and no blocking modal active.
- Add is allowed with or without an active search filter.
- If an inline Rename is active, clicking Add first discards that Rename draft.

### Interaction sequence

1. Click **Add New Client**.
2. Show an **Add New Client** modal above the table with a name input and **Add/Submit** and **Cancel** controls. Background is inert.
3. Begin with an empty draft. If this modal was previously cancelled, the prior draft is **not** restored.
4. User enters a name and clicks Add/Submit. The Enter-key behavior is not yet finalized (see §11); if supported, it must share the same submission guard.
5. Validate before issuing any network request. For an empty/whitespace-only name, show a non-retryable validation error popup with **Close** only; no mutation request is sent. Closing the error restores the Add modal (the user may correct the draft).
6. For valid input, submit once and show a blocking spinner overlay above the Add modal. Disable all background and modal actions while pending.
7. On confirmed success, apply G-06 (reset, refetch, return to default view).
8. On confirmed retryable failure, show an error popup with **Retry** and **Cancel/Dismiss**. Retry resubmits the *same* intended request once and shows the spinner again. Dismiss returns to the Add modal with draft preserved.
9. On confirmed non-retryable rejection (e.g., uniqueness conflict), show an informative popup without Retry. Closing returns to the Add modal with draft preserved for correction.
10. On unknown outcome, do not offer blind mutation Retry; direct the user to reconciliation/refresh.
11. Clicking **Cancel** on the Add modal (when no mutation is pending) closes it and discards its draft.

### Postconditions

- Successful Add: exactly one new client created for the confirmed request; refreshed default table displays authoritative data; identity retained.
- Validation rejection: no network mutation, no database change.
- Confirmed server rejection: no committed create; user can correct retained draft or cancel it.
- Modal Cancel: no request submitted by that cancellation; draft discarded.

## 6. Rename Client — behavioral contract

### Preconditions

- A client row is visible and no mutation is pending or blocking modal active.

### Interaction sequence

1. Click **Rename** in a row.
2. Replace that row's displayed name with an editable input initialized from its current name; focus and select/highlight the name. Replace row actions with **Save** and **Cancel**.
3. The user can replace or modify the name. Cancel exits inline editing and discards the draft.
4. Clicking Rename on another row, Add New Client, or another available row action automatically discards the current Rename draft and enters the selected context. No discard-confirmation dialog is required.
5. On Save, perform the same whitespace-only validation as Add. Invalid input opens a non-retryable validation popup; close returns to the inline editor with draft preserved.
6. Valid Save initiates one request and a blocking spinner. Underlying inline editor/draft remain logically intact until outcome is known.
7. Confirmed success invokes G-06.
8. Confirmed retryable failure: Retry reissues the intended rename; dismiss restores the editor and draft.
9. Confirmed uniqueness rejection: no Retry; close returns to editable draft.
10. Unknown outcome: reconcile; no blind retry.

### Postconditions

- Successful Rename: same client ID; updated name stored; default table reloaded.
- Cancel or switch context: no rename submitted; unsaved Rename draft discarded.
- Confirmed failure: preserved editable draft after dismissing error.

## 7. Delete Client — behavioral contract

### Preconditions

- A client row is visible; no mutation is pending or blocking modal active.

### Interaction sequence

1. Click **Delete** in a row.
2. If another row is being renamed, discard that Rename draft first.
3. Open a blocking confirmation popup identifying the target client (e.g., **Delete ABC Farms?**) with **Confirm** and **Cancel**.
4. Cancel closes the confirmation popup without issuing a mutation and returns to the default table context.
5. Confirm initiates one delete request and a blocking spinner.
6. Confirmed success invokes G-06.
7. If dependent records reference the client, backend rejects deletion under G-09; display a clear non-retryable error; closing returns to the table with the client still present.
8. Other confirmed retryable failures may offer Retry; unknown outcomes require reconciliation, not blind retry.

### Postconditions

- Confirmed deletion: record absent from authoritative refreshed list.
- Cancel: no delete request.
- Referential-integrity rejection: client remains intact.

## 8. Modal, pending, error, and timeout behavior

### Modal stack semantics

- The client table is the base layer.
- Add or Delete confirmation overlays the table; a spinner or error may overlay the current context.
- Only the topmost layer receives pointer or keyboard input. Escape, Enter, and focus behavior must not accidentally trigger actions on obscured layers.
- Dismissing an error popup is **not** equivalent to cancelling the underlying Add/Rename context.

### Pending request

- Show blocking spinner immediately after a valid mutation submission.
- No user cancellation of an in-flight mutation is promised.
- Disable all mutation controls and guard against duplicate submissions.
- Preserve the relevant draft/context for possible confirmed failure recovery.

### Ten-second long-request policy

1. If a mutation remains unresolved after **10 seconds**, replace/overlay the spinner with a timeout decision popup.
2. Offer **Keep Waiting** and **Stop Waiting & Refresh**.
3. **Keep Waiting:** continue observing the *same* original request, with another 10-second observation interval. Never submit a duplicate request. Repeat if still unresolved.
4. If the original request resolves while the timeout dialog is visible, handle its authoritative success/rejection immediately and close the timeout dialog.
5. **Stop Waiting & Refresh:** stop waiting for the request locally, optionally abort the client-side transport, discard feature-level drafts, and initiate a fresh read of client records. Explicitly warn that the server may still commit the original mutation. This is **not** a transaction rollback.
6. If refresh fails, display a refresh-specific error and allow retrying **the read only**.
7. If the old mutation completes after local abandonment, its late response must not overwrite the new UI state. A newly fetched list may still become stale if the backend commits afterward; this limitation is documented.

### Error classes and actions

| Error class | Example | UI response | Mutation retry? |
|---|---|---|---|
| Frontend validation | Whitespace-only name | Validation popup; Close; restore edit context | No |
| Confirmed non-retryable server rejection | Duplicate normalized name; referenced client deletion | Specific error; Close; preserve relevant draft/context | No |
| Confirmed retryable failure | Server explicitly confirms no commit and reports transient failure | Error popup; Retry or Dismiss | Yes, only if backend contract establishes safety |
| Unknown mutation outcome | Timeout, connection lost, ambiguous server response | Uncertain outcome; reconcile/refresh | No |
| Post-success refresh failure | Mutation confirmed, subsequent GET fails | Refresh error; retry list fetch | Never repeat mutation |
| Initial list fetch failure | GET clients fails | Loading/error view with retry read | Not applicable |

**Conservative default:** If the frontend cannot confidently classify a failed mutation as confirmed non-commit, classify it as **unknown**, not retryable. Backend error-response semantics are needed to support safe retries.

## 9. Acceptance tests (behavioral, technology-agnostic)

Each test follows **Given / When / Then**. Automated tests should assert user-visible results and request counts, not internal component structure.

### Identity, list, and search

**AT-01 — Identity gate**  
Given no session identity, when the workflow is opened, then client management actions are unavailable until a username is accepted.

**AT-02 — Initial list**  
Given a username was accepted, when client retrieval succeeds, then the client table and Add New Client control appear with fetched records.

**AT-03 — List fetch failure**  
Given client retrieval fails, when the response is handled, then the UI shows a fetch error and does not misleadingly show a successful empty table.

**AT-04 — Search**  
Given multiple clients are loaded, when a user enters a partial name in search, then the visible table updates to matching records; clearing search restores the unfiltered list.

### Add

**AT-05 — Open Add**  
Given default view, when Add New Client is clicked, then an Add modal opens with an empty draft and background controls are inert.

**AT-06 — Cancel Add**  
Given a nonempty Add draft, when Cancel is clicked and Add is reopened, then the field is empty and no create request was made by cancellation.

**AT-07 — Invalid Add**  
Given a whitespace-only draft, when Submit is clicked, then a non-retryable validation popup appears and zero mutation requests are sent; Close returns to the Add modal.

**AT-08 — Valid Add success**  
Given a valid name, when Add is submitted and the backend confirms success, then one create request is made, the management workflow resets, a fresh list is requested, the search and drafts are empty, and session identity remains.

**AT-09 — Duplicate Add**  
Given a normalized name already exists, when Add is submitted, then the backend rejects it, no duplicate is committed, the popup has no Retry, and closing it restores the Add draft.

**AT-10 — Confirmed retryable Add failure**  
Given backend confirms a non-commit transient failure, when Retry is clicked, then one additional create request is sent with the same intended payload; when Dismiss is clicked instead, the Add draft is preserved.

### Rename

**AT-11 — Enter Rename**  
Given a displayed row, when Rename is clicked, then its name becomes an editable, selected input and row actions become Save and Cancel.

**AT-12 — Cancel Rename**  
Given a changed Rename draft, when Cancel is clicked, then the original displayed name returns and no rename request is made.

**AT-13 — Switch Rename target**  
Given row A has an unsaved Rename draft, when Rename on row B is clicked, then A's draft is discarded and B enters edit mode with B's current name selected.

**AT-14 — Rename to Add**  
Given an unsaved Rename draft, when Add New Client is clicked, then Rename is cancelled and an empty Add modal opens.

**AT-15 — Invalid Rename**  
Given a whitespace-only Rename draft, when Save is clicked, then no mutation request occurs; Close on the validation popup restores the editable draft.

**AT-16 — Rename success**  
Given a valid Rename, when the backend confirms success, then the client ID is unchanged, the management UI resets, and the fresh list reflects authoritative state.

**AT-17 — Duplicate Rename**  
Given Rename would violate normalized uniqueness, when Save is submitted, then the backend rejects it; no Retry is offered; the draft is preserved for correction.

### Delete

**AT-18 — Delete confirmation**  
Given a row, when Delete is clicked, then a blocking confirmation names that client and offers Confirm and Cancel.

**AT-19 — Cancel Delete**  
Given the confirmation popup, when Cancel is clicked, then no delete request is sent and the table is restored.

**AT-20 — Delete success**  
Given an unreferenced client, when Confirm is clicked and deletion succeeds, then the workflow resets and the refreshed list excludes the deleted client.

**AT-21 — Referenced Delete**  
Given a client referenced by a dependent record, when deletion is confirmed, then the backend rejects it, the UI explains why without offering Retry, and the client remains.

**AT-22 — Switch Rename to Delete**  
Given a Rename draft in row A, when Delete on row B is clicked and then cancelled, then A's draft remains discarded and the table returns to viewing mode.

### Global pending, failures, and reset

**AT-23 — Duplicate submission guard**  
Given a mutation is pending, when users repeatedly click controls or press submission keys, then at most one mutation request is initiated.

**AT-24 — Modal keyboard isolation**  
Given a topmost popup is open, when keyboard shortcuts/Enter/Escape are used, then no underlying form or table action fires inadvertently.

**AT-25 — Success clears state but not identity**  
Given a nonempty search and/or feature draft before a successful mutation, when success and refresh complete, then search, drafts, edit state, and modals are cleared but session identity remains.

**AT-26 — Post-success refresh failure**  
Given mutation success is confirmed but the list refresh fails, when the error is displayed and the user retries, then only the list GET is repeated; the mutation is never resubmitted.

**AT-27 — Timeout prompt**  
Given a pending mutation without response for 10 seconds, when the threshold is reached, then a decision popup offers Keep Waiting and Stop Waiting & Refresh.

**AT-28 — Keep Waiting**  
Given the timeout popup, when Keep Waiting is selected, then the original request remains active, no new mutation is issued, and another timeout prompt may appear after 10 more unresolved seconds.

**AT-29 — Resolve while timeout popup visible**  
Given the timeout popup is visible, when the original request receives authoritative success, then the timeout popup closes and the success reset/refetch proceeds.

**AT-30 — Stop Waiting**  
Given a pending mutation, when Stop Waiting & Refresh is selected, then the UI stops awaiting that request, starts a fresh list read, does not claim rollback, and does not retry the mutation.

**AT-31 — Late response safety**  
Given the user stopped waiting and a new view was established, when a late response from the abandoned request arrives, then it does not restore a stale draft or overwrite the newer UI state.

**AT-32 — Unknown outcome**  
Given a network failure without authoritative commit status, when the error is displayed, then the UI does not offer blind mutation Retry and explains that refreshing may not establish rollback.

**AT-33 — One active edit context**  
Given an Add modal or inline Rename is active, when an incompatible context is requested, then no two edit contexts remain active simultaneously.

### Backend integrity and attribution

**AT-34 — Normalized uniqueness on create**  
Given `ABC Farms` exists, when another name with the same normalized key is inserted, then the database rejects the insert, including under concurrent requests.

**AT-35 — Normalized uniqueness on rename**  
Given two clients, when renaming one would collide with the other's normalized key, then the database rejects the update and preserves the original record.

**AT-36 — Restrictive deletion**  
Given a dependent record references a client ID, when deletion is attempted through the backend, then the database prevents it regardless of frontend state.

**AT-37 — Last-write-wins**  
Given two sessions edit the same client from an older read, when their valid updates commit sequentially, then the later committed update is authoritative; no conflict-resolution UI is required in v1.

**AT-38 — Attribution**  
Given a session identity, when a mutation is recorded, then the audit record attributes it to that self-declared label; the system does not represent it as verified authentication.

## 10. Backend requirements and implementation notes (not UI design)

- Store stable `client_id`, display `client_name`, and a derived `client_name_standardized` or equivalent expression/index.
- Use a database-level UNIQUE constraint/index on the normalized comparison key. An application-only pre-insert lookup is insufficient against races.
- Normalize consistently for create and rename. Confirmed policy: trim, collapse consecutive whitespace to one underscore, and lowercase; use one consistent implementation for INSERT and UPDATE. Precise Unicode whitespace/casefold edge behavior can be documented during backend implementation. Preserve original display name separately.
- Validate empty/whitespace-only names on **both frontend and backend**; frontend validation alone cannot protect the database/API.
- Prevent deletion of referenced clients with restrictive foreign keys; use triggers only for additional business rules not covered by constraints. Ensure FK enforcement is actually enabled in the chosen database.
- Define backend error responses so frontend can distinguish confirmed non-commit, confirmed non-retryable rejection, and ambiguous outcomes. If this cannot be guaranteed, default to unknown outcome.
- Record audit history of successful mutations (actor label, operation, client ID, relevant before/after values, timestamp) according to the audit feature's separate specification; do not claim authentication.
- Do not implement server-side cancellation as part of the 10-second UI timeout feature.
- UI implementation may use React state and a synchronous ref guard; these are possible mechanisms, not acceptance criteria.

## 11. Implementation-readiness decisions and remaining questions (2026-10-11)

1. **Username / shared application state — confirmed:** Self-entered username is application-level state owned by the root above independent configuration workflows. In v1, use root React state and props. Username survives CRUD workflow resets and navigation within the mounted application, but a full browser refresh clears it and requires re-entry. Keep the identity interface isolated so future `sessionStorage` persistence and React Router navigation can be added without substantial Client CRUD refactoring. Rejecting blank/whitespace-only usernames remains a recommendation pending approval. This is attribution, not authentication.
2. **Table columns — deferred:** Display all selected columns together, with Action last. Exact set of fields is undecided; finalize before table UI implementation.
3. **Search — decided in part:** Fetch the client list and filter locally, without server search or pagination in v1. Prefix versus substring matching and case handling remain to be confirmed; recommended case-insensitive substring matching on displayed names.
4. **Keyboard policy — decided:** Do not implement custom keyboard shortcuts (including custom Enter-to-save and Escape-to-cancel) in v1. Preserve standard keyboard accessibility, Tab navigation, button activation, focus management, and modal focus containment. Semantic `<form>` elements are allowed, but Enter may submit a form by default; suppress implicit submission if the intended interaction requires clicking the explicit Save/Add control.
5. **Name normalization — confirmed:** Trim leading/trailing whitespace, collapse each consecutive whitespace run to a single underscore, and lowercase for the hidden standardized key. Preserve the human-readable display name. Enforce `UNIQUE` on standardized key for INSERT and UPDATE; near-duplicate detection remains deferred. Examples: ` ABC   Farms ` → `abc_farms`; `ABC Farm` → `abc_farm`.
6. **Safe retry — decided:** Backend returns stable machine-readable error codes with explicit confirmed non-commit semantics. Retry is shown only for allowlisted, confirmed-safe errors; unrecognized errors have no Retry. Unknown outcomes require refresh/reconciliation rather than mutation resubmission.
7. **Delete audit and referential scope — backend workstream:** Document required restrictive foreign keys and audit behavior, but specify the exact dependent tables, trigger needs, and audit schema in the backend feature cycle. No requirement for redundant triggers where foreign keys suffice.
8. **Timeout transport — limitation accepted:** After 10 seconds, offer Keep Waiting or Stop Waiting & Refresh. Keep Waiting continues observing the original request for another 10 seconds. Stop Waiting abandons local request handling and initiates a fresh read; frontend cancellation does not promise backend rollback. No additional transport cancellation protocol in v1.
9. **Post-refresh stale commit — limitation accepted:** A server mutation may commit after the frontend abandons waiting and refreshes, leaving a temporarily stale list. Document this possibility; no automatic reconciliation or status polling in v1.

These are targeted implementation-readiness questions, not a reason to expand the feature into full-platform design.

## 12. Decision register (snapshot, 2026-10-11)

| ID | Decision | Rationale / consequence |
|---|---|---|
| ADR-C001 | Temporary self-entered username gates management | Enables progress; not secure authentication |
| ADR-C002 | Add is a blocking modal; Rename is inline; Delete uses confirmation modal | Predictable and minimal interaction model |
| ADR-C003 | Cancel Add/Rename discards draft | Consistent, simple; revisitable |
| ADR-C004 | Switching inline Rename context silently discards old draft | One active edit; no extra confirmation complexity |
| ADR-C005 | Only empty/whitespace-only client names are syntactically invalid | Minimal validation scope |
| ADR-C006 | Database enforces normalized uniqueness | Correctness across requests; fuzzy matching deferred |
| ADR-C007 | Successful mutation resets entire management workflow and refetches; identity persists | One global success rule |
| ADR-C008 | Pending mutation blocks UI | Reliability over concurrency within one session |
| ADR-C009 | Error dismissal preserves draft; editing Cancel discards it | Separates error acknowledgement from operation cancellation |
| ADR-C010 | At 10 seconds, offer Keep Waiting or Stop Waiting & Refresh | Avoid indefinite trapped spinner without claiming backend rollback |
| ADR-C011 | Unknown mutation outcomes are not blindly retried | Prevent false certainty and duplicate side effects |
| ADR-C012 | Cross-session edits use last-write-wins | Prototype simplicity; conflicts deferred |
| ADR-C013 | Referenced client deletion is rejected by database integrity rules | Protect dependent data |
| ADR-C014 | Audit attribution uses self-declared identity | Traceability only, not authenticated accountability |
| ADR-C015 | Search instead of pagination for initial UX | Easier discovery with small client list |
| ADR-C016 | Client search filters an already-loaded list locally | Avoid server search complexity for small datasets |
| ADR-C017 | No custom keyboard shortcuts in v1 | Keep keyboard accessibility; avoid unnecessary shortcut logic |
| ADR-C018 | Mutation Retry is allowlisted by explicit backend error code and confirmed non-commit | Unrecognized errors must not invite unsafe retry |
| ADR-C019 | Document late-commit/stale-refresh limitations without additional mitigation in v1 | Explicit risk acceptance and bounded scope |
| ADR-C020 | Add and Rename drafts are discarded on operation cancellation | Consistent draft lifecycle |
| ADR-C021 | Root-owned temporary username lasts until full browser refresh | Keep identity outside feature; later storage/router changes remain localized |
| ADR-C022 | Normalize names by trimming, collapsing whitespace runs to one underscore, and lowercasing | Stable uniqueness key; preserve original display name |

**Decision-record policy:** This table is a current snapshot. In the repository, preserve material decision changes in dated, append-only ADR entries rather than silently rewriting history.

## 13. Deferred enhancement backlog

- Proper authentication and authorization; identity/session lifecycle.
- Optimistic concurrency control, version fields, conflict notices, or stronger cross-user coordination.
- Fuzzy/near-duplicate warnings (`ABC Farms` vs. `ABC Farm`), alias management, or manual merge review.
- More advanced name canonicalization and localization policy.
- Server-side idempotency keys, mutation status lookup, or authoritative cancellation/reconciliation protocol.
- Search performance improvements, pagination, sorting, and large-list handling.
- Optional draft preservation on Cancel, unsaved-changes warnings, and richer keyboard/accessibility refinements.
- Soft deletion/archive semantics if dependent-data workflows require it.
- Expanded audit exploration and authenticated attribution.

## 14. Suggested implementation/testing order

1. Resolve only the blocking open decisions in §11.
2. Define backend client schema, normalization/uniqueness, FK restrictions, and explicit error contracts.
3. Build identity gate and initial table/read/search behavior.
4. Implement Add flow and test normal/invalid/duplicate/retry/unknown outcomes.
5. Implement inline Rename and context-switch draft rules.
6. Implement Delete confirmation and referential-integrity errors.
7. Implement shared blocking overlay, 10-second waiting decisions, stale-response guard, and success reset.
8. Run acceptance tests plus backend constraint tests; perform independent code review.
9. Record final design decisions and known limitations before stakeholder demonstration.

---

**Document maintenance:** Update the current specification when intended behavior changes; preserve dated rationale in append-only ADR records. Keep acceptance tests synchronized with the actual approved behavioral contract.