# Strata Client CRUD — Learning Experiments Roadmap

**Originally created:** 2026-10-11  
**Updated:** 2026-10-12  
**Status:** Living learning and implementation roadmap; refine each lab when it begins.  
**Authoritative feature reference:** `01-client-crud.md` — **Client CRUD — Feature Specification and Acceptance Tests, v0.6 (2026-10-12)**. If the repository contains an older copy, replace or clearly distinguish it. The feature specification, not this roadmap, governs production behavior.

## 1. Mission and operating philosophy

Learn the frontend/full-stack mechanisms needed to deliver **Strata's real Client CRUD feature**, while minimizing duplicate implementation work.

**Updated method: production-intended feature components, experimental dependencies.** Instead of implementing unrelated fictional apps and later translating them into Strata, use **Client Management** as the shared subject of the labs. Build focused, potentially reusable components and service boundaries, but substitute in-memory records, fake endpoints, controlled responses, or a small local database while studying each mechanism. Replace these dependencies deliberately when integrating into Strata.

Each lab exists to answer **one bounded engineering question**. It is **not** a separate attempt to complete production Client CRUD or the whole Strata platform. Do not apply the full feature-development SOP to every educational lab: the production feature already has a behavioral specification. For each lab, identify the mechanism, model only what is needed, implement incrementally, test relevant edge cases, document what was learned, and stop.

**Two complementary rules:**

1. **Design for reuse, not assumed production readiness.** Passing an experiment does not certify integration, accessibility, reliability, or production behavior. Review against the latest feature specification and tests before adoption.
2. **Keep experimental infrastructure outside reusable code.** UI components should depend on explicit props/contracts or a thin service boundary, not directly import lab-only fake services. Production and fake implementations should be swappable without rewriting the component's interaction model.

**Learning style:** Work incrementally; reason through states, event flow, React ownership and JavaScript behavior before introducing abstractions. Prefer small code changes and deliberate experiments over large generated implementations. Understand the mechanisms being adopted.

## 2. Current feature decisions that all labs must respect

Version 0.6 replaces inline Rename with **modal Edit Client**. The table is the default view; **Add**, **Edit**, and **Delete confirmation** are mutually exclusive blocking action contexts. No background action switching is permitted while a modal is open.

- **G-04 / G-12 — Modal exclusivity and focus:** only the topmost dialog is interactive; underlying table controls, keyboard activation and focus are blocked. Native HTML `<dialog>` with `showModal()` is a candidate mechanism, with React/DOM synchronization, focus restoration and stacked-dialog behavior verified explicitly.
- **G-11 — Entity-level draft isolation:** Add initializes a fresh object-shaped draft such as `{ client_name: "" }`; Edit initializes a new draft from the selected fetched client's editable attributes. Neither changes authoritative fetched records. The immutable `client_id` is held separately as the mutation target. Cancel discards; error dismissal preserves; confirmed success discards.
- **G-05 — One pending mutation:** block duplicate submissions and other interactions while an operation is unresolved.
- **G-06 — Confirmed success:** reset feature-level drafts, search and dialogs; refetch authoritative clients; preserve the root-owned self-declared username. Full readiness requires successful refresh.
- **G-07 / G-08 — Error semantics:** confirmed rejection can preserve recoverable drafts; only explicitly allowlisted, confirmed-non-commit errors can offer mutation Retry. An unknown commit outcome must not be blindly retried.
- **G-01–G-03 / G-09 — Backend integrity:** immutable numeric ID, whitespace-only invalid names, database-enforced normalized-name uniqueness, and restrictive referential integrity.

**Scope reminder:** the identity gate is temporary attribution, not authentication. Custom Enter/Escape shortcuts are not required, but ordinary keyboard accessibility and modal focus containment are. Timeout and late-response handling belong primarily to Lab 03; actual HTTP classification to Lab 04; persistence constraints to Lab 05.

## 3. Experiment map

| Lab | Focused engineering question | Reusable target / outcome | Experimental substitute |
| --- | --- | --- | --- |
| `01-task-tracker` (complete) | How do React state, props, callbacks and basic async UI work? | Historical learning reference | Independent Task Tracker; do not retrofit |
| `02-ui-state-lab` | How do Client CRUD action contexts, drafts and modal layers coordinate? | Client table and action dialogs; workflow/state ownership | Local sample clients and controlled UI outcomes |
| `03-async-request-lab` | How do client mutations behave while delayed, failed, timed out or abandoned? | Async coordination, submission guards and stale-response handling | Fake client service with controllable promises |
| `04-http-contract-lab` | How can the frontend reliably interpret backend mutation outcomes? | API adapter and explicit response/error contracts | Minimal FastAPI endpoints, initially controlled responses |
| `05-database-integrity-lab` | Which client invariants must survive bypassing the UI? | Tested schema/constraint and data-access patterns | Small SQLite client + dependent-record schema |
| `06-behavior-testing-lab` | How can tests protect Client CRUD behavior through integration? | Reusable UI/API/database tests | Mocks, fake timers, local test fixtures |

These labs are **mechanism-focused stages of one feature**, not five independent, feature-complete Client CRUD applications.

## 4. `02-ui-state-lab` — Client Management UI

**Question:** How should Client CRUD state, drafts, action contexts and dialogs be represented and coordinated?

**Build:** A minimal Client Management interface with sample client records, list/search, **Add Client modal**, **Edit Client modal**, **Delete confirmation**, and simulated pending/error layers. The same names, props and components may be adopted in Strata after review. No real backend or database is required.

**Practice:**
- Model a single active action context: view / add / edit(target client ID) / delete(target client ID). Avoid redundant booleans that permit contradictory contexts.
- Represent Add/Edit as separate **object-shaped drafts**, initialized on modal entry and isolated from fetched records. Cancel discards; confirmed error dismissal preserves.
- Keep workflow, draft, pending and error-overlay responsibilities distinct. A completed failure is no longer pending.
- Coordinate parent-owned workflow with child components through props and callbacks; understand `useState`, `useRef`, conditional rendering, mount/unmount and state lifetime.
- Implement native modal interaction (`<dialog>` / `showModal()` where suitable), keyboard/focus containment, sensible focus restoration and stacked error overlays.
- Simulate only enough pending/error behavior to verify layering and transitions. Defer real promise races, timeouts and transport to later labs.

**Relevant spec:** G-04–G-07, G-11–G-12; AT-05–AT-07, AT-11–AT-15, AT-18–AT-19, AT-22, AT-24, AT-33 and AT-39. The UI should not silently change the approved behavior.

**Done when:** Add/Edit/Delete contexts are exclusive; entity drafts initialize, preserve and discard correctly; fetched records do not change during editing; the topmost dialog isolates interaction; component ownership and state transitions can be explained.

**Out of scope:** real HTTP, database integrity, authenticated identity, production styling, full timeout protocol, exhaustive testing. Keep the interface minimal; table columns remain subject to the production spec's open decisions.

## 5. `03-async-request-lab` — Client Mutation Lifecycle

**Question:** How can the Client CRUD UI safely coordinate one asynchronous mutation when responses are delayed or uncertain?

**Build:** Exercise Add/Edit/Delete operations through a **fake client service** with controllable success, confirmed rejection, delay, unresolved operations and late completion. Reuse the relevant Lab 02 UI/contracts rather than rebuild the full table.

**Practice:** `Promise`, `async`/`await`, `try/catch/finally`; rendering pending state versus synchronous `useRef` duplicate-submission guards; preserving submitted payload/context; a ten-second **Keep Waiting** vs **Stop Waiting & Refresh** decision; continuing to observe the same original request; local abandonment without promising backend rollback; request identity/generation guards so late responses do not overwrite newer UI state. Differentiate confirmed rejection from unknown outcome.

**Relevant spec:** G-05–G-08; §8 ten-second policy; AT-23, AT-27–AT-32.

**Done when:** Rapid submissions produce one mutation; timeout decisions never create duplicate mutations; late abandoned responses cannot reset newer UI state; success, confirmed failure and unknown outcome remain distinguishable.

**Out of scope:** real HTTP response semantics, server-side cancellation, durable idempotency and actual rollback of an in-flight server mutation.

## 6. `04-http-contract-lab` — Client API Boundary

**Question:** How should React and FastAPI communicate authoritative outcomes without unsafe retry assumptions?

**Build:** A minimal FastAPI service and a frontend client API adapter using `fetch`. Start with controlled endpoints/responses; connect to the existing Client CRUD operation boundary, not a newly invented frontend.

**Practice:** HTTP methods/statuses, JSON payloads, network failures versus HTTP error responses, malformed responses, stable machine-readable error codes, explicit confirmed-non-commit semantics, allowlisted safe retry, non-retryable duplicate/validation errors and conservative unknown-outcome handling. Ensure UI error messages do not determine retry safety.

**Relevant spec:** G-07–G-08, §8 error classes, §10 backend error-contract requirements, §11 safe-retry decision.

**Done when:** The adapter distinguishes success, confirmed non-retryable rejection, confirmed-safe retryable rejection and unknown outcome, and the UI chooses the appropriate action without parsing human-readable message text.

**Out of scope:** full production API, authentication, deployment and guarantees of exactly-once distributed execution.

## 7. `05-database-integrity-lab` — Client and Dependent Records

**Question:** Which invariants must the database enforce regardless of frontend behavior?

**Build:** Small SQLite schema with a client table and at least one referencing dependent table. Reuse the real Client CRUD identity and naming semantics; production adoption depends on the eventual database technology and migration conventions.

**Practice:** Immutable numeric `client_id`; display name versus standardized uniqueness key; trim surrounding whitespace, collapse whitespace runs to `_`, lowercase; UNIQUE on INSERT and UPDATE; restrictive foreign keys with SQLite FK enforcement enabled; transactions and rollback; why application-side prechecks do not prevent races; clear API mapping of constraint errors.

**Relevant spec:** G-01–G-03, G-09; AT-34–AT-36; §10. Unicode edge semantics and exact dependent tables remain implementation decisions.

**Done when:** Equivalent normalized names cannot coexist, conflicting Edit is rejected, referenced Delete is blocked and failed transactions leave no partial changes.

**Out of scope:** complete Strata database, audit implementation, production migrations and broad performance engineering.

## 8. `06-behavior-testing-lab` — Regression Protection

**Question:** How do we prove that Client CRUD's intended user-visible behavior survives code changes and integration?

**Build:** Add tests primarily to code from the earlier labs; do **not** create another full Client CRUD app. Use Vitest and React Testing Library for frontend behavior, FastAPI tests for contracts, and database tests for integrity; add selected integration tests where valuable.

**Practice:** User-level assertions for modal isolation, fresh/retained/discarded drafts, immutable IDs, request counts, confirmed errors, success reset and preserved username; fake timers/deferred promises for ten-second policy and stale responses; backend contract and constraint tests. Prefer behavioral assertions over tests coupled to internal component state.

**Relevant spec:** Representative §9 acceptance tests, particularly AT-06–AT-07, AT-12–AT-15, AT-23–AT-32, AT-34–AT-36, AT-39–AT-40.

**Done when:** Deliberately introduced regressions in the key workflows and boundaries cause reliable test failures.

**Out of scope:** exhaustive E2E coverage, full production CI/CD and tests for unrelated Strata features.

## 9. Repository and reuse strategy

A straightforward starting layout:

```text
frontend-experiments/
├── EXPERIMENT_ROADMAP.md
├── 01-task-tracker/           # Completed historical project
├── 02-ui-state-lab/          # Client CRUD UI components + local fixtures
├── 03-async-request-lab/     # Async mechanisms / fake service
├── 04-http-contract-lab/    # HTTP adapter + minimal FastAPI
├── 05-database-integrity-lab/# SQLite integrity exercises
└── 06-behavior-testing-lab/  # Tests and/or pointers to tests in prior labs
```

**Avoid five diverging frontend copies.** Later labs should either (a) import/exercise earlier components where simple, (b) extend the same working implementation through a deliberate integration step, or (c) isolate a narrow mechanism and transfer it after validation. Choose based on the actual dependency/tooling cost **when reaching that lab**. Separate directories do not require separately duplicated apps. Do not introduce a monorepo framework, shared package, Redux, Zustand, TanStack Query or a state-machine library without a demonstrated need.

**Boundary example:** `AddClientModal` accepts a draft and callbacks/props appropriate to its UI responsibility; the coordinating layer calls a `clientService.createClient(...)` contract. In Lab 03 the service is fake; in production the implementation uses the real API. Do not hardwire `fakeCreateClient` inside reusable UI. Decide exact state ownership during Lab 02; avoid freezing an API prematurely.

## 10. Integration into Strata: verification gate

A lab's code is a **candidate reusable artifact**, not automatically production-ready. Before adoption:

1. Check against the **latest** Client CRUD specification, invariants and acceptance tests; resolve relevant open decisions.
2. Confirm component props, state ownership, modal accessibility and draft lifecycle in the actual Strata application.
3. Replace fake services/fixtures with the correct API/data adapters without leaking experimental dependencies into production code.
4. Verify request lifecycle, error codes, duplicate guards, unknown outcomes, post-success refetch and stale-response protection at the appropriate layers.
5. Test database constraints, audit attribution and integration behavior as applicable; review code independently and record material decisions.

**Production readiness belongs to the integrated feature**, not to any individual lab.

## 11. Execution discipline and handoff instructions for a new chat

**When starting a new lab or conversation:**

1. Read **this roadmap** and the latest **Client CRUD feature specification** (v0.6 as of 2026-10-12). If the spec isn't provided, ask for it rather than inventing missing invariants.
2. Confirm which lab is active and what was already implemented. Do not assume later labs are complete or that older examples (meeting-room reservations, inline Rename) are still current.
3. Refine **only that lab's README, boundaries, state model and immediate tasks**. Do not prematurely specify all future labs; this roadmap is directional and deliberately revisable.
4. Coach step-by-step: let the developer propose state transitions and component responsibilities, review them, then implement in small increments. Explain syntax, React mechanics and data/control flow as needed; avoid generating a whole app at once unless requested.
5. Use Client CRUD naming and contracts, with fake data/services for mechanisms outside the lab's scope. Aim for production reuse without claiming production readiness.
6. At completion, capture: question answered, mechanism learned, artifacts suitable for reuse, verification performed, remaining limitations and next integration step. Stop rather than expanding indefinitely.

**Current starting point (2026-10-12):** `01-task-tracker` is complete. `02-ui-state-lab` is the next active lab. State modeling has established the value of separate action context, request status, draft and error layers. The **new** feature design uses blocking **Add/Edit/Delete dialogs**, not inline Rename; the next step is to revise the Lab 02 README/state model and begin a small Client Management UI implementation using local records. Labs 03–06 remain future work and should be refined individually.

**North star:** Learn deeply enough to own and review the code, while shipping Strata's Client CRUD with minimal redundant effort and explicit production verification.

# Appendix: Client CRUD — Feature Specification and Acceptance Tests

**Project:** Management Configuration  
**Feature:** Client reference-data management  
**Version:** 0.6 (modal Edit Client and entity-level drafts)  
**Date:** 2026-10-12  
**Status:** Approved interaction model; remaining implementation details explicitly identified  
**Scope:** One bounded feature. Not a specification for the entire platform.

## 1. Purpose and boundaries

Provide a simple management workflow where a user enters a temporary self-declared name, views and searches clients, and creates, edits, or deletes client records. The feature prioritizes predictable behavior, data integrity, and understandable error recovery over advanced optimization.

### In scope

- Temporary session identity gate (name entry).
- Initial retrieval and display of clients in a table.
- Client-name search/filtering.
- Add Client modal, Edit Client modal, Delete confirmation modal.
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
- **Client draft:** A separate object holding editable client attributes for Add or Edit; in v1 it contains only `client_name`. It is not the authoritative fetched record.
- **Active action context:** At most one Add modal, Edit modal, or Delete confirmation modal is active; otherwise the table is in its default viewing context.
- **Mutation:** Create, Update (Edit), or Delete request to backend.
- **Confirmed success:** Backend response authoritatively indicates mutation committed.
- **Confirmed rejection:** Backend response establishes that mutation was not committed.
- **Unknown outcome:** No authoritative confirmation whether mutation committed (e.g., lost response or timeout).
- **Refresh:** Retrieve current client list and reset feature-level UI state; not necessarily a browser reload.
- **Modal popup:** Blocking overlay over the existing screen. Only its topmost layer accepts interaction.

## 3. Global invariants and contracts

**G-01 — Stable client identity.** Each client has an immutable numeric primary key (`client_id`). Editing changes allowed attributes, not the ID.

**G-02 — Name validity.** A client name is invalid only when it is empty or consists entirely of whitespace. A name with at least one non-whitespace character is syntactically valid. Duplicate-name rules are separate database-integrity rules. No other character restrictions are currently specified.

**G-03 — Uniqueness.** The database enforces uniqueness on a consistently derived normalized name key, on both INSERT and UPDATE. The confirmed normalization policy is to trim leading/trailing whitespace, replace each consecutive whitespace run with one underscore, and lowercase for comparison, while preserving the human-readable `client_name`. The key is a lookup/uniqueness key, not a second immutable identity.

**G-04 — UI exclusivity.** At most one Add, Edit, or Delete action modal is active in a management UI. Opening one makes the underlying table and other actions inert until that modal closes. No inline editing or background action switching occurs in v1.

**G-05 — Mutation exclusivity.** At most one mutation request is initiated and tracked as pending in one UI session. Pending controls are disabled; duplicate click/Enter submissions cannot initiate another request. A synchronous submission guard in addition to render-state disabling may be used.

**G-06 — Success reset.** Following confirmed mutation success, discard all feature-level drafts, filters, and dialogs, refetch clients, and return to the default table view. Preserve the session identity. Do not report full readiness until the refresh succeeds.

**G-07 — Failure preserves recoverable work.** A confirmed server rejection returns the user to the underlying Add or Edit modal with its draft preserved after the error dialog is dismissed, except that an explicit Cancel of that editing context discards the draft.

**G-08 — Unknown outcomes are not failures.** Do not automatically retry a mutation when commit status is unknown. Show an uncertainty/reconciliation message and offer a fresh read. Refreshing does not guarantee that an in-flight backend operation cannot commit later.

**G-09 — Database referential integrity.** Deletion of a referenced client is rejected. Use restrictive foreign keys for ordinary relationships; triggers are reserved for additional rules requiring them. The API maps database errors into understandable messages.

**G-10 — Cross-session behavior.** The initial release accepts last-write-wins updates across different sessions. Database transaction locks may still serialize writes; they do not imply lost-update prevention. Audit history is for traceability, not verified proof of human identity.

**G-11 — Draft isolation.** Add and Edit each initialize an independent object-shaped draft containing only editable attributes (`client_name` in v1). Typing changes the draft, not the fetched client record. Cancel discards the draft; dismissing an error retains it; confirmed success discards it during the global reset. `client_id` is never editable.

**G-12 — Modal focus.** Only the topmost modal is interactive; background pointer actions, form submission, keyboard shortcuts, and focus movement must not activate underlying controls. Focus should return to a sensible surviving control on dismissal.

## 4. User entry and default management view

1. Before showing management controls, request a username.
2. Once a name is accepted, preserve it for the management session as an attribution label.
3. Fetch the client list from the backend.
4. Show the client table, a client-name search input, and **Add New Client** at top right.
5. Each row has an **Action** column with **Edit** and **Delete** controls. Remaining table columns are TBD.
6. Search filters the visible list as the user types. Initial implementation may filter the fetched list locally; exact matching behavior and data-volume assumptions should be recorded during implementation.
7. During initial loading and refresh, display an appropriate loading state; a failed list fetch displays a read/refresh error, never an empty list falsely presented as successful.

**Default management state:** Search empty; no active modal; no draft; current fetched list displayed; actions enabled.

**Identity boundary:** A successful CRUD mutation resets the management workflow, **not** the identity gate. Re-authentication is not required after each mutation.

## 5. Add New Client — behavioral contract

### Preconditions

- Identity gate completed and management interface available.
- No mutation currently pending and no blocking modal active.
- Add is allowed with or without an active search filter.
- No other action modal is open. An active Edit modal must be cancelled before Add can be opened.

### Interaction sequence

1. Click **Add New Client**.
2. Show an **Add New Client** modal above the table with a name input and **Add/Submit** and **Cancel** controls. Background is inert.
3. Begin with a new draft object containing an empty `client_name`. If this modal was previously cancelled, the prior draft is **not** restored.
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

## 6. Edit Client — behavioral contract

### Preconditions

- A client row is visible, and no mutation or blocking modal is active.
- The selected client has a stable `client_id` and currently fetched editable attributes.

### Interaction sequence

1. Click **Edit** in a client row. The table remains unchanged behind a blocking **Edit Client** modal.
2. Initialize a **new object-shaped draft** from the selected record's editable attributes. In v1, the draft contains only `client_name`; `client_id` is retained separately as the immutable mutation target.
3. Display the name field prefilled with the selected client's current display name. Focus/select the name input for convenient replacement (normal keyboard accessibility remains; no custom shortcuts).
4. The user may change the draft without modifying the displayed table record or sending a backend mutation.
5. **Cancel** closes Edit and discards the entire draft. Reopening Edit initializes a fresh draft from the currently fetched record. The modal blocks clicking Add, Edit on another row, or Delete until it closes.
6. **Save** validates the draft using the same whitespace-only rule as Add. Invalid input opens a non-retryable validation popup; Close restores Edit with the draft preserved and sends no mutation.
7. A valid Save sends one Update request targeting the original `client_id`, with the editable name, and shows a blocking spinner above the Edit modal.
8. Confirmed success invokes G-06. The `client_id` remains unchanged.
9. Confirmed allowlisted retryable failure: Retry reissues the same intended Update; dismissing the error restores Edit and its draft.
10. Confirmed uniqueness rejection: no Retry; Close restores Edit with its draft for correction.
11. Unknown outcome: do not blindly retry; use the reconciliation/refresh policy.

### Postconditions

- Successful Edit: same client ID; updated name persisted; default table refetched.
- Cancel: no Update request from that cancellation; draft discarded and authoritative row unchanged.
- Confirmed failure: editable draft preserved after error dismissal.
- No other client attributes are editable in v1. Future memo/other attributes require separate field, API, validation, and test decisions.

## 7. Delete Client — behavioral contract

### Preconditions

- A client row is visible; no mutation is pending or blocking modal active.

### Interaction sequence

1. Click **Delete** in a row.
2. Delete is available only from the default table context; an open Add or Edit modal must be closed first.
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
- Dismissing an error popup is **not** equivalent to cancelling the underlying Add/Edit context.

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

### Edit

**AT-11 — Open Edit with fresh draft**  
Given a displayed client, when Edit is clicked, then a blocking Edit Client modal opens with a name draft initialized from the selected client's current display name, and the name field is focused/selected.

**AT-12 — Cancel Edit**  
Given a modified Edit draft, when Cancel is clicked, then the modal closes, no Update request is sent, and the table record is unchanged. Reopening Edit initializes a fresh draft from the fetched record, not the cancelled draft.

**AT-13 — Edit isolates underlying table**  
Given an Edit modal is open, when the user attempts to activate Add, Edit on another row, Delete, or search in the background, then no background action occurs and the current Edit draft remains intact.

**AT-14 — Add and Edit drafts are independent**  
Given Add is opened and cancelled after typing a name, when Edit is opened, then Edit starts from the selected client's record and does not inherit the cancelled Add draft (and vice versa).

**AT-15 — Invalid Edit**  
Given a whitespace-only Edit name draft, when Save is clicked, then no Update request occurs; Close on the validation popup restores Edit with the draft preserved.

**AT-16 — Edit success**  
Given a valid Edit draft, when the backend confirms success, then the client ID is unchanged, the management UI resets, and the fresh list reflects authoritative state.

**AT-17 — Duplicate Edit**  
Given Edit would violate normalized uniqueness, when Save is submitted, then the backend rejects it; no Retry is offered; the Edit draft is preserved for correction.

### Delete

**AT-18 — Delete confirmation**  
Given a row, when Delete is clicked, then a blocking confirmation names that client and offers Confirm and Cancel.

**AT-19 — Cancel Delete**  
Given the confirmation popup, when Cancel is clicked, then no delete request is sent and the table is restored.

**AT-20 — Delete success**  
Given an unreferenced client, when Confirm is clicked and deletion succeeds, then the workflow resets and the refreshed list excludes the deleted client.

**AT-21 — Referenced Delete**  
Given a client referenced by a dependent record, when deletion is confirmed, then the backend rejects it, the UI explains why without offering Retry, and the client remains.

**AT-22 — Delete unavailable behind Edit**  
Given an Edit modal is open for row A, when the user attempts Delete on row B, then no Delete confirmation opens and the Edit draft remains intact; after cancelling Edit, Delete may be opened normally.

### Global pending, failures, and reset

**AT-23 — Duplicate submission guard**  
Given a mutation is pending, when users repeatedly click controls or press submission keys, then at most one mutation request is initiated.

**AT-24 — Modal keyboard isolation**  
Given a topmost popup is open, when keyboard navigation or activation occurs, then no underlying form or table action fires inadvertently; custom Enter/Escape shortcuts are not required in v1.

**AT-25 — Success clears state but not identity**  
Given a nonempty search and/or Add/Edit draft before a successful mutation, when success and refresh complete, then search, drafts, action state, and modals are cleared but session identity remains.

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

**AT-33 — One active action context**  
Given an Add, Edit, or Delete modal is active, when the user attempts to activate a background action, then the existing modal remains the sole action context and no second action modal opens.

### Backend integrity and attribution

**AT-34 — Normalized uniqueness on create**  
Given `ABC Farms` exists, when another name with the same normalized key is inserted, then the database rejects the insert, including under concurrent requests.

**AT-35 — Normalized uniqueness on edit**  
Given two clients, when editing the name of one would collide with the other's normalized key, then the database rejects the update and preserves the original record.

**AT-36 — Restrictive deletion**  
Given a dependent record references a client ID, when deletion is attempted through the backend, then the database prevents it regardless of frontend state.

**AT-37 — Last-write-wins**  
Given two sessions edit the same client from an older read, when their valid updates commit sequentially, then the later committed update is authoritative; no conflict-resolution UI is required in v1.

**AT-38 — Attribution**  
Given a session identity, when a mutation is recorded, then the audit record attributes it to that self-declared label; the system does not represent it as verified authentication.

**AT-39 — Draft isolation from fetched record**  
Given Edit is open, when the user changes its draft without saving, then the underlying client list and original fetched record remain unchanged.

**AT-40 — Edit request targets immutable ID**  
Given an Edit draft for client ID 7, when Save is submitted, then the Update targets ID 7 regardless of name changes, and the ID is never editable.

## 10. Backend requirements and implementation notes (not UI design)

- Store stable `client_id`, display `client_name`, and a derived `client_name_standardized` or equivalent expression/index.
- Use a database-level UNIQUE constraint/index on the normalized comparison key. An application-only pre-insert lookup is insufficient against races.
- Normalize consistently for create and edit. Confirmed policy: trim, collapse consecutive whitespace to one underscore, and lowercase; use one consistent implementation for INSERT and UPDATE. Precise Unicode whitespace/casefold edge behavior can be documented during backend implementation. Preserve original display name separately.
- Validate empty/whitespace-only names on **both frontend and backend**; frontend validation alone cannot protect the database/API.
- Prevent deletion of referenced clients with restrictive foreign keys; use triggers only for additional business rules not covered by constraints. Ensure FK enforcement is actually enabled in the chosen database.
- Define backend error responses so frontend can distinguish confirmed non-commit, confirmed non-retryable rejection, and ambiguous outcomes. If this cannot be guaranteed, default to unknown outcome.
- Record audit history of successful mutations (actor label, operation, client ID, relevant before/after values, timestamp) according to the audit feature's separate specification; do not claim authentication.
- Do not implement server-side cancellation as part of the 10-second UI timeout feature.
- UI implementation may use React state and a synchronous ref guard; these are possible mechanisms, not acceptance criteria.

## 11. Implementation-readiness decisions and remaining questions (updated 2026-10-12)

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

## 12. Decision register (snapshot, updated 2026-10-12)

| ID | Decision | Rationale / consequence |
|---|---|---|
| ADR-C001 | Temporary self-entered username gates management | Enables progress; not secure authentication |
| ADR-C002 | Add and Edit are blocking modals; Delete uses confirmation modal | Consistent entity-level editing; supports future fields |
| ADR-C003 | Cancel Add/Edit discards draft | Consistent, simple; revisitable |
| ADR-C004 | Modal action isolation replaces inline Rename switching | Background actions are inert while Edit is open |
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
| ADR-C020 | Add and Edit drafts are discarded on operation cancellation | Consistent draft lifecycle |
| ADR-C021 | Root-owned temporary username lasts until full browser refresh | Keep identity outside feature; later storage/router changes remain localized |
| ADR-C022 | Normalize names by trimming, collapsing whitespace runs to one underscore, and lowercasing | Stable uniqueness key; preserve original display name |
| ADR-C023 | Replace inline Rename with modal Edit Client, limited to client name in v1 | Consistent Add/Edit pattern; future fields can be added without inline-editor redesign |
| ADR-C024 | Add/Edit use isolated entity-level drafts; background actions are blocked by modals | No unsaved-edit switching policy needed; cancel discards draft |

**Decision-record policy:** This table is a current snapshot. In the repository, preserve material decision changes in dated, append-only ADR entries rather than silently rewriting history.

## 13. Deferred enhancement backlog

- Proper authentication and authorization; identity/session lifecycle.
- Optimistic concurrency control, version fields, conflict notices, or stronger cross-user coordination.
- Fuzzy/near-duplicate warnings (`ABC Farms` vs. `ABC Farm`), alias management, or manual merge review.
- More advanced name canonicalization and localization policy.
- Server-side idempotency keys, mutation status lookup, or authoritative cancellation/reconciliation protocol.
- Search performance improvements, pagination, sorting, and large-list handling.
- Optional draft preservation on Cancel, unsaved-changes warnings, and additional keyboard conveniences (without reducing baseline accessibility).
- Additional editable client attributes (e.g., `client_memo`) and corresponding Add/Edit fields, API contracts, and database migrations.
- Soft deletion/archive semantics if dependent-data workflows require it.
- Expanded audit exploration and authenticated attribution.

## 14. Suggested implementation/testing order

1. Resolve only the blocking open decisions in §11.
2. Define backend client schema, normalization/uniqueness, FK restrictions, and explicit error contracts.
3. Build identity gate and initial table/read/search behavior.
4. Implement Add flow and test normal/invalid/duplicate/retry/unknown outcomes.
5. Implement Edit modal with object-shaped draft and draft-isolation tests.
6. Implement Delete confirmation and referential-integrity errors.
7. Implement shared blocking overlay, 10-second waiting decisions, stale-response guard, and success reset.
8. Run acceptance tests plus backend constraint tests; perform independent code review.
9. Record final design decisions and known limitations before stakeholder demonstration.

---

**Document maintenance:** Update the current specification when intended behavior changes; preserve dated rationale in append-only ADR records. Keep acceptance tests synchronized with the actual approved behavioral contract.