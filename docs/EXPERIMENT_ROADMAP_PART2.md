# EXPERIMENT_ROADMAP_PART2 — Crop Plan Configuration (Revision 2)

Nov 11, 2026 · @zhe

## Status and revision history

The crop plan experiments are now two labs instead of five: **Lab 07 (frontend, including async against a fake service)** and **Lab 08 (full stack)**. Lab 06 (React Router) is complete. Lab 07 Part A is complete; Part B (async) is next.

| Revision | Date | Change |
| --- | --- | --- |
| 2 | 2026-11-11 | Collapsed Labs 07–11 into Lab 07 (frontend) and Lab 08 (full stack). Resolver and its tests moved into Lab 07. Crop editor page removed in favor of a field dialog on the overview. |
| 1 | 2026-11-02 | Original sequence: 07 static UI, 08 state and resolution, 09 database, 10 HTTP contract, 11 integration. |

**Why the restructure.** The original sequence assumed the backend would resolve inheritance and the frontend would only display it. Lab 07 established the opposite: the frontend fetches one raw bundle per client and year and resolves it locally, and the backend only validates and appends. As a result:

- Most of the old Lab 08 (resolver, state transitions, test vectors) was already done inside Lab 07, because the static UI could not render without it.
- The old Labs 09–11 all concern one boundary (SQLite, FastAPI, and wiring the adapter), whose patterns were already proven in Labs 04 and 05. Keeping them separate would mainly add handoffs.
- Two labs mean fewer carry-overs and one document trail that is easier to manage as a sole developer.

## Mission and methodology

The mission is unchanged: extend the tested Client Management prototype into a crop input configuration workflow that captures fixed crop inputs and memos, preserves every committed edit, and resolves inheritance across revisions. It is not a forecast engine or a final design system.

The progression is now **routing → data shape and resolver → UI → async against a fake service → real database and HTTP → integrated prototype**.

The bounded-experiment method from Labs 02–06 still applies:

1. State one primary engineering question per lab and write the behavioral contract before code.
2. Map knowledge gaps and run small, disposable experiments only where the mechanism is unfamiliar.
3. Implement the minimum reusable capability, then verify at the correct boundary.
4. Reuse proven patterns (request locking, stale-response protection, unknown-outcome reconciliation, unit of work, error translation) before inventing new ones.
5. Record dated decisions as they are made, not only at the end.
6. Prefer a sound Phase 1 baseline over optional features; new ideas go to the backlog unless they block correctness.

**Testing allocation:** pure logic (resolver, formatters, gate, catalog consistency) gets deterministic unit tests. UI layout and workflows are verified by manual walkthroughs. Database and HTTP layers get automated pytest suites in Lab 08. Full browser automation stays deferred.

## Revised lab structure

Lab 07 ends when the full user journey works against a fake service that behaves like the real API. Lab 08 ends when the same journey works against SQLite and FastAPI with no component changes.

| Lab | Primary question | Scope | Exit gate |
| --- | --- | --- | --- |
| 07 — Crop Plan Frontend | Can the crop plan workflow (context, resolution, editing, adding crops, async outcomes) work entirely in the frontend against a contract-shaped fake service? | Part A: routing and URL context, data shape, resolver and tests, overview and field dialog UI, Add crop. Part B: fake service, loading and read errors, stale responses, validation, pending and request locking, save then refetch, error outcomes. | A user can choose a context, add a crop, commit values with memos, see inherited values and provenance, and view revision history, against the fake service, including failure cases. |
| 08 — Crop Plan Full Stack | Can SQLite and FastAPI replace the fake service while preserving every Lab 07 behavior and Client CRUD? | Schema and services, append-only writes with server-assigned id and timestamp, bundle read and append routes, real adapter, regression on Client CRUD. | The spec's Phase 1 acceptance gate passes against the real backend, and Client CRUD tests still pass. |

**The bridge between the labs is the fake service.** It exposes exactly the operations Lab 08 will expose over HTTP, so Lab 08 replaces its internals and nothing above it:

- `fetchBundle(clientId, forecastYear)` returns the raw rows for that client and year.
- `appendInput(row)` validates the row, assigns `id` and `createdAt` itself, stores it, and returns the stored row.

## Lab 07 — Crop Plan Frontend

Part A is complete as of 2026-11-11. Part B (async against a fake service) is next.

### Part A — completed

| Area | Outcome |
| --- | --- |
| Routing and context | Single `crop-plans` route. Client, year and revision live in search params; the URL is the only store for context. A context gate classifies partial, invalid and valid contexts. Changing client or year resets the revision to 1 in the same navigation. |
| Data shape | Raw rows per client and year, integer ids, `revisionId` for identity and revision `order` for precedence. Catalogs for clients, crops, revisions, categories and card groups. No revision registry. |
| Resolver | Pure function: filter by revision order, sort once (revision order, then id, descending), first row per crop and category wins, history holds the target revision's rows newest first, `isInherited` computed. |
| Tests | Resolver suite (RES-01 to RES-08, HIST-01, HIST-02, zero, empty, no mutation) and catalog consistency suite. |
| Overview UI | Two-stage page, revision pills, legend, crop cards in three groups on a shared five-column grid, fields as unstyled buttons, styled on shared tokens. |
| Field dialog | Modal opened by field click, bound to the context it was opened in; current value with provenance, memo, value and memo inputs, history with memos. Save logs the would-be row. |
| Add crop | Inline crop select, draft card with all fields missing, draft visible only at revision 1 for its client and year. |
| CSS | Tokens and shared components in `styles/`; feature CSS per feature; crop field classes renamed `.crop-field*`. |

### Part B — remaining scope

1. **Fake service** shaped as the Lab 08 contract: private in-memory store, simulated delay, controllable failures, server-assigned `id` and `createdAt`.
2. **Bundle loading:** request on client and year change, loading and read-error states (UI-13 returns), stale-response protection when the context changes mid-request.
3. **Input validation in the dialog:** empty or non-numeric values are blocked inline and never reach the service; zero is accepted.
4. **Saving:** request lock against double submits, pending state, success refetches the bundle and closes the dialog, the draft crop becomes a real card through the derived rule.
5. **Outcomes:** rejected returns to the draft with a message; retryable offers retry; unknown reconciles by refetching.
6. **Close-out:** manual walkthrough checklist, Lab 07 patterns doc Part B, spec and roadmap updates.

## Lab 08 — Crop Plan Full Stack

Lab 08 replaces the fake service with SQLite and FastAPI and proves no Lab 07 behavior regresses. It begins in its own thread, carrying this roadmap, the revised spec and both Lab 07 patterns docs.

**Scope:**

1. **Schema:** an append-only input table keyed by client, year, crop, revision, crop year and input type, with value, memo, `created_at` and `created_by`; catalogs for crops, categories and revisions with foreign keys.
2. **Services:** atomic append with server-assigned id and UTC timestamp; bundle read for one client and year; validation of references, categories and numeric values; error translation reusing the Lab 05 pattern.
3. **HTTP:** one read route (bundle) and one write route (append), Pydantic schemas, the Lab 04 outcome contract (success, rejected, retryable, unknown).
4. **Adapter:** a real `cropPlanApi.js` with the same function signatures as the fake service, plus adapter tests for response parsing and error classification.
5. **Regression:** existing Client CRUD database, service, API and adapter tests continue to pass.
6. **Resolver agreement:** run the Lab 07 resolver test vectors against the forecast engine's Python resolver, including the tie-break rule.

**Out of scope:** forecast engine execution, crop activation or deletion, completeness checks, full browser end-to-end tests, multi-user concurrency.

## Cross-lab regression ledger

Every contract below must stay true from the lab that first proved it onward.

| Contract | First proved | Verified by |
| --- | --- | --- |
| Client Management remains usable | 06 | Manual walkthrough; Lab 05 test suites |
| Context lives only in the URL; refresh and links reproduce the screen | 07A | Manual walkthrough |
| No data renders for a partial or invalid context | 07A | Manual walkthrough; gate tests |
| Latest eligible revision, then highest id, determines the value | 07A | Resolver tests |
| History shows only the target revision's rows, newest first | 07A | Resolver tests (HIST-01, HIST-02) |
| Zero and missing are distinct everywhere | 07A | Resolver test; formatter; manual check |
| Provenance names the actual source revision | 07A | Resolver tests; dialog walkthrough |
| A field edit commits only to the context it was opened in | 07A (UI) / 07B (save) | Manual walkthrough with back and forward |
| A crop's first input is committed in revision 1 | 07A | Manual walkthrough |
| A draft crop is never persisted before its first save | 07A | Manual walkthrough |
| Historical rows are append-only; id and timestamp are server-assigned | 07B (fake) / 08 (real) | Service tests |
| Validation, rejected, retryable and unknown outcomes do not mislead the UI | 07B | Manual walkthrough; adapter tests in 08 |
| The resolver's input and output do not change between fake and real backends | 08 | Same resolver tests against real bundles |

## Known limitations and open decisions

### Accepted Phase 1 limitations

| Limitation | Effect | Revisit |
| --- | --- | --- |
| Malformed year (`year=abc`) | Classified as partial instead of invalid | When hardening the gate |
| Revision validity | Gate validates against the full catalog, while offered revisions depend on the data | Before saves land (07B) |
| Crop card order | Follows object key order (numeric crop id), not catalog order | If display order ever matters |
| Forecast years | Hard-coded list | When a years table exists |
| Field dialog after back then forward | Could reopen empty, because the edit context is hidden rather than cleared | 07B |
| Empty value | Currently logs as 0; inline validation planned | 07B |
| Client ids in tests | Uniqueness and row references to clients are not tested; the database guarantees them | 08 |

### Open decisions

| Decision | Due | Notes |
| --- | --- | --- |
| Does the forecast engine need every category in revision 1, or only the crop? | Before 08 | If all ten are required, a completeness rule is needed, which the spec currently excludes. |
| Tie-break rule shared with the engine | 08 | Frontend uses highest id within the winning revision; the engine currently uses latest timestamp. They must agree. |
| Decimal representation in SQLite | 08 | Numbers in the frontend; storage precision to decide. |
| Identical value and memo resubmission | 07B | New version or no-op. |
| Unknown-outcome and retry details for appends | 07B | Reuse the Lab 03–04 reconciliation pattern. |
| Per-category decimal display | Later | Current rule: integers plain, decimals to two places. |

## Backlog and documentation protocol

### Deferred backlog (not in Labs 07–08)

- Crop active state, crop removal or archive, clearing an individual input.
- Forecast completeness, input applicability and engine integration.
- Cross-year rules, calculation snapshots, reproducible historical forecasts.
- Revision freeze, approval, diffs and per-revision comparisons.
- Multi-field editing, autosave, persistent drafts, multi-user concurrency control.
- Browser end-to-end tests and full design-system harmonization.
- Sliding animation when a draft card is added or discarded.

### Documentation protocol

1. Record dated decisions during the lab, not only at the end.
2. Write a patterns doc per lab part, kept short: **Lab 07 Part A** (URL state, data shape, resolver, derived data, UI composition), **Lab 07 Part B** (async against the fake service), **Lab 08** (database, HTTP and integration).
3. Update the feature specification whenever business behavior changes, and this roadmap only when evidence changes the plan.
4. Lab 08 starts in its own thread, carrying this roadmap, the specification and the Lab 07 patterns docs.

### Definition of done for Part 2

An internal user can choose a client, year and available revision; add a crop from the catalog; commit individual values with memos; see inherited values and their source revision; and view the selected revision's field history. SQLite and FastAPI provide authoritative persistence and errors, and Client CRUD regression tests still pass. Stop there for Phase 1.