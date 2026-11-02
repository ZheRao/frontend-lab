# EXPERIMENT_ROADMAP_PART2 — Crop Plan Input Configuration

**Status:** Governing roadmap (evolving)  
**Created:** 2026-11-02  
**Companion specification:** `CROP_INPUT_CRUD_FEATURE_SPECIFICATION.md`  
**Predecessors:** `02-ui-state-lab`, `03-async-request-lab`, `04-http-contract-lab`, `05-database-integrity-lab`

## 1. Mission

Extend the tested Client Management prototype into a **multi-page crop input configuration prototype**. The implementation progression is intentionally incremental:

**Router → Static pages → In-memory mechanics → Database services → HTTP contracts → Integrated UI.**

The immediate goal is not a forecast engine or a final design system. It is a reliable, understandable configuration workflow that captures fixed crop inputs and memos, preserves edits, and respects crop-plan-wide revision context and dynamic inheritance.

## 2. Governing methodology

Retain the existing bounded-experiment approach:

1. Start each lab in its **own discussion thread**, carrying this roadmap and the specification as handoff context.
2. State one primary engineering question; document minimal contracts/invariants before implementation.
3. List concrete knowledge gaps; use small experiments rather than broad architecture speculation.
4. Implement the minimum reusable capability that answers the question; verify with focused tests and manual scenarios.
5. Reuse previous labs' patterns, particularly request locking, ambiguous-outcome reconciliation, database transactions, and error classification.
6. Document decisions and guarantees at the end of each lab; update the roadmap only when evidence justifies changes.
7. Prefer shipping a sound Phase 1 baseline to exploring optional features. Reserve new requirements for the deferred backlog unless they block correctness.

**Testing allocation:** React layout → visual inspection; pure resolution logic → deterministic unit tests; database/HTTP → automated integrity and response tests; final frontend → focused adapter tests plus manual workflow walkthroughs. Full browser-flow automation may be postponed for Phase 1.

## 3. Fixed handoff context

### 3.1 Screens

- **Overview:** client, forecast year, and **single governing revision selector**; configured crop cards, `+ Add Crop`, `Edit inputs >`.
- **Crop configuration:** one crop, two prior-year + eight current-year categories, resolved values, grey inherited/green same-revision indicators, edit and history actions; **no revision selector**.
- **Field editor:** one numeric value and optional memo; save/cancel; read-only context; **no revision selector**.
- Add Crop must include a **crop dropdown**, not hard-code Durum.

### 3.2 State and data principles

- Only available global revisions are offered, starting at `1-pre-seeding`; creation of the next revision auto-selects it.
- An individual crop need not have inputs in every global revision. A selected revision determines eligibility of earlier field versions independently for each category.
- Saving appends a historical version; filtering the same records provides committed field history.
- New crop drafts are in-memory and not committed until the first successful field save; other fields remain `—`.
- Missing (`—`) and numeric zero are different.
- Inherited values carry source revision/version provenance.
- No individual input deletion, custom metrics, crop `active` mechanism, crop deletion, completeness check, cross-year inheritance, or forecast execution in this phase.

### 3.3 Existing tested foundations to carry forward

- Client CRUD view and its existing API and DB tests must continue working.
- Established frontend pending/abort/refresh handling; unknown outcomes must reconcile with the server.
- FastAPI validation/response handling, SQLite unit-of-work, and pytest patterns.
- No need to reconstruct every possible future feature or optimize final UI styling during the experiments.

## 4. Experiment sequence

### 06 — React Router Lab

**Primary question:** How can independent configuration pages coexist in a navigable application without breaking client management?

**Scope / experiment:** Add an application shell and routes for existing Client Management and a placeholder Crop Plan Configuration overview. Exercise browser navigation and direct route loading; define a simple pattern for returning from subviews later.

**Reusable outcome:** Router structure, navigation shell, route ownership boundaries.

**Verification:** Existing client management remains functional; route refresh/back/forward and unknown routes are coherent; no new crop business mechanics.

**Exit gate:** A working multi-page shell with preserved client CRUD and a clean crop-plan route placeholder.

**Out of scope:** Finished crop-plan UI, final design system, crop data persistence.

### 07 — Crop Plan Static UI Lab

**Primary question:** Can the three-screen user journey and all important presentation states be represented coherently with static React components and in-memory sample objects?

**Scope / experiment:**
- Overview client/year controls, available revision display, empty state, crop cards.
- Add Crop action with **crop dropdown** and initial blank crop configuration.
- Crop editor showing ten categories grouped Prior/Current and effective value/source labels.
- Single-field editor with value, memo, save/cancel visual states.
- Read-only revision label in crop/field editor, but no revision selection there.
- Example history and loading/empty/error visual states where helpful.

**Reusable outcome:** Component layout and props/data-shape expectations; visual design direction compatible with client UI (styling unification can remain later).

**Verification:** Manual visual checklist for empty/partial/inherited/explicit value/history/draft states and desktop viewport; controlled categories render accurately.

**Exit gate:** All three screen types and Add Crop dropdown are visually reviewable without any backend or real mutations.

**Out of scope:** Persisted data, real revision resolution, full asynchronous requests.

### 08 — Crop Plan State & Resolution Lab

**Primary question:** How can the three screens support correct crop drafts, global revision context, per-field commits, resolved inheritance, provenance, and committed history using only in-memory objects?

**Scope / experiment:**
- In-memory append-only input-version collection and available-revision registry.
- Global context switching (client/year/revision) on overview only; fixed context in crop/field workflow.
- Crop-selection draft and first-save visibility; navigation/cancel draft policy.
- Single-field commit and source indicator updates.
- Pure deterministic resolver: highest eligible revision, then latest committed version; category-by-category resolution.
- Selected-revision-only history query and basic memo behavior.

**Reusable outcome:** Working local interactive prototype; documented domain functions and state transitions; test vectors for later Python resolution.

**Verification:** Unit tests for resolver and critical state transitions, including no writes on cancel, revision isolation, inherited updates, equal timestamp tie-breaking, and zero versus missing.

**Exit gate / milestone:** A user can navigate, select a crop, commit a first input, create/select revisions, override inherited fields, and view local history—all entirely in memory.

**Out of scope:** FastAPI, SQLite, production persistence, concurrent editing.

**Design note:** Avoid permanently maintaining competing JS/Python revision resolvers. This lab proves mechanics; backend becomes authoritative once integrated.

### 09 — Crop Input Database Lab

**Primary question:** How can SQLite preserve append-only input versions and plan-wide revision availability with enforceable integrity guarantees?

**Scope / experiment:**
- Minimal controlled crop identities/categories and revision availability representation.
- Append-only versions compatible with client/year/crop/revision/crop-year/input-type/value/memo/audit metadata.
- Atomic save, listing, field history, and effective-value resolution returning provenance.
- Deterministic latest-version tie-breaking, numeric precision decision, foreign-key/integrity validation, transaction boundaries.
- Revision creation independent of individual crop record creation.

**Reusable outcome:** Python DB services plus schema and test fixtures.

**Verification:** pytest for revision precedence, history ordering, zero vs missing, invalid references/categories, rollback, duplicate revision protection, and source provenance. Compare outputs against Lab 08 test vectors.

**Exit gate:** DB services resolve every agreed scenario deterministically and preserve every committed field edit.

**Out of scope:** Frontend HTTP wiring, forecast engine execution, activation/deletion.

### 10 — Crop Input HTTP Contract Lab

**Primary question:** How should the frontend read crop plan context, resolved inputs, revision-local history, and commit single-field edits with explicit success/error semantics?

**Scope / experiment:** Define minimal FastAPI routes, Pydantic request/response schemas, normalized error mapping, client API adapter, and authoritative read-back behavior. No speculative endpoint families.

**Reusable outcome:** Stable HTTP contracts for crop-plan reads, global revisions, field commit, and field history.

**Verification:** FastAPI endpoint tests: success, invalid field/crop/revision, duplicate revision, busy, unknown error, and persist-then-read consistency. Client adapter tests for response parsing and error classification.

**Exit gate:** All operations in the specification have documented request/response/error behavior tested without relying on full React UI.

**Out of scope:** Full end-to-end UI, forecast readiness/engine integration.

### 11 — Crop Plan Integration Lab

**Primary question:** Can the in-memory crop workflow be replaced by the real HTTP/SQLite services while preserving all tested behavior and the existing client portal?

**Scope / experiment:** Replace local mutations/reads with API adapter; reuse pending states, request locking, stale-response protection, refresh reconciliation, error dialogs, and field history loading. Preserve one governing context in crop/field views.

**Reusable outcome:** Database-backed Phase 1 crop configuration prototype.

**Verification:** Existing client management tests plus crop DB/API suites, focused frontend adapter/request tests, and manual full user journeys. Test unknown outcomes, failed refreshes, and successful read-after-commit explicitly.

**Exit gate:** Meet the companion specification's Phase 1 acceptance gate and demonstrate no regression to client CRUD.

**Out of scope:** Forecast completeness/engine execution, crop activation/deletion, full browser E2E suite, final aesthetic polish.

## 5. Cross-lab regression ledger

| Contract | First proved in | Must remain true thereafter |
|---|---|---|
| Existing Client Management remains usable | 06 | 07–11 |
| Crop configuration/field editor cannot switch revisions | 07 | 08–11 |
| Add Crop dropdown; no commit on unsaved draft | 07 display / 08 mechanics | 09–11 |
| Global revision availability independent of per-crop edits | 08 | 09–11 |
| Latest eligible revision + latest version determines value | 08 | 09–11 |
| Committed history is exact-revision filtered data | 08 | 09–11 |
| Historical edits are append-only | 08 simulation / 09 persistence | 10–11 |
| Provenance identifies actual source revision/version | 08 | 09–11 |
| Validation/busy/unknown outcomes do not mislead UI | 10 | 11 |

## 6. Open decisions: resolve just in time

**Lab 07–08:** Exact placement of source/history UI and draft preservation when navigating between crop views. How to present existing memo when a value is inherited.

**Lab 08–09:** Whether identical value + memo resubmission is a new version or no-op; exact ordering of commits and available revisions.

**Lab 09:** SQLite representation of decimal values, controlled categories and units, allowed numeric bounds, revision registry shape, deterministic version tie-breaker.

**Lab 10–11:** API route shape, stale selection/request handling, response schema, retryability and unknown-outcome reconciliation details.

Keep these as explicit decisions. Do not allow an unanswered future enhancement to block a bounded lab unless the invariant cannot be implemented correctly without it.

## 7. Deferred enhancement backlog (not part of current sequence)

- Crop `active` state, greyed-out inactive cards, forecast exclusion/re-activation.
- Remove/archive crop or individual category clear behavior.
- Forecast completeness, input applicability, and forecast engine integration.
- Cross-year rules; calculation snapshots, historical forecast reproducibility.
- Revision freeze/approval/diff views, per-revision comparisons.
- Multi-field spreadsheet editing, autosave, persistent drafts, multi-user concurrency controls.
- Comprehensive browser E2E coverage and final client/crop design-system harmonization.

## 8. Documentation and handoff protocol

At the conclusion of each lab:

1. Produce a lab README: engineering question, experiments, key files, results, test commands, limitations.
2. Add a concise one-line entry in the parent experiments index.
3. Write implementation/invariant documentation in the actual frontend/backend project if the pattern is adopted.
4. Add only relevant changes to the decision log and update the companion feature specification when business behavior changes.
5. Keep this roadmap as the cross-lab governing document; subsequent labs get their own conversation threads.

### Copyable next-thread kickoff: Lab 06

> We're beginning `06-react-router-lab` for the Growlytics frontend. We completed the client CRUD experiments (`02-ui-state-lab` through `05-database-integrity-lab`). Read `EXPERIMENT_ROADMAP_PART2.md` and `CROP_INPUT_CRUD_FEATURE_SPECIFICATION.md` as the governing handoff. This lab has one question: how to add a multi-page application shell with existing Client Management and a placeholder Crop Plan Configuration route without breaking established client CRUD. Do not implement crop input domain mechanics yet. Start with route/component architecture, knowledge gaps, smallest useful experiment, and verification steps.

## 9. Definition of done for Part 2

An internal user can navigate from the client portal to crop-plan configuration, choose context and an available global revision, select a crop via dropdown, preserve/cancel drafts without persistence, commit individual values with memos, view dynamically inherited effective inputs and source provenance, and query selected-revision field history. SQLite/FastAPI establish authoritative persistence and errors; regression coverage demonstrates that client CRUD still works.

**Stop there for Phase 1.** Additional forecasting behavior and crop activity state require separately scoped decisions.