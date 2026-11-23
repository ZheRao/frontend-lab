# Lab 08 — Crop Plan Full-Stack Integration

**Experiment:** 08 — Crop Plan Backend & Integration  
**Closure date:** 2026-11-20  
**Status:** Closed — Phase 1 experimental scope accepted  
**Predecessor:** Lab 07 — Crop Plan Frontend (static UI, resolver, and asynchronous fake service)

## Focused engineering question

Can SQLite and FastAPI replace the Crop Plan frontend's simulated storage while preserving the existing client/year context, revision inheritance, append-only field history, draft behavior, and asynchronous recovery contracts, without regressing Client Management?

**Decision: Yes, for the bounded Phase 1 configuration slice.** The real backend is integrated with React, reference catalogs are fetched from the backend, automated tests pass, and the assembled application has been manually exercised. This is **not** a claim that the forecast engine, deployment, or the entire platform is production-ready.

## Scope delivered

- **Persistent records:** SQLite `crop_plan` table with append-only field submissions and foreign keys to clients, forecast years, crops, revisions, and category keys; server-assigned record ID and timestamp.
- **Backend service and HTTP boundary:** FastAPI GET for the raw client/year bundle; POST to append one field value; Pydantic contracts; predictable outcomes for successful append, invalid value/reference, database busy, and unexpected failure.
- **Server-backed metadata:** GET catalogs for clients, crops, revisions, crop-plan categories, and forecast years. Forecast Years is an independent domain in preparation for future configuration work.
- **Frontend API adapters:** Fetch, parse, validate, and classify HTTP responses. Crop-plan record data is mapped to the established frontend camelCase contract; non-append-only catalogs retain their agreed snake_case properties.
- **Catalog initialization:** One `Promise.all()` load with `loading | ready | error` state and catalog-specific recovery. The crop-plan workspace is gated until metadata is ready.
- **Preserved Lab 07 frontend:** URL client/year/revision selection, dynamic revision resolver, source/inheritance indicators, selected-revision history, temporary revision-1 crop draft, field editing, and write → authoritative read-back → success workflow.
- **Regression and integration:** Client Management continues functioning against the expanded relational schema.

## Implementation boundaries and contracts

### Persistence and authority

- The backend validates references and finite, non-negative input values. A submitted `0` is valid.
- Each successful field write appends a new record; it does not update an earlier record. Repeated values remain history entries.
- Record ID, creation timestamp, and author metadata are assigned by the backend. Lab 08 uses the interim `current_user` provider; real authentication is a later concern.
- A client with referencing crop-plan records cannot be deleted under the database's `ON DELETE RESTRICT` foreign key.
- GET `/crop-plan/{client_id}/{forecast_year}` returns raw rows for one workspace; `[]` is a legitimate empty workspace.

### Frontend resolution

- The frontend retains authority for projecting the raw bundle into the selected revision; no duplicate backend revision resolver was introduced.
- For each crop/category, the highest eligible revision order wins; within that revision, the highest record ID wins.
- Zero is distinct from absence. The winning row carries its provenance; local field history is limited to the selected revision, newest ID first.
- Revision selection is a local projection of the loaded client/year bundle; a different client/year triggers a new read.
- An uncommitted crop draft is transient and scoped to revision 1; the first confirmed field append creates the persistent crop card.

### Async and failure behavior

- A synchronous `requestLock` blocks duplicate writes from the component; request generations distinguish superseded reads and writes.
- Known rejected POST outcomes return to the editor with its draft; unknown mutation outcomes require refresh/reconciliation rather than blind resubmission.
- A confirmed append followed by a failed read-back is reported separately from a failed append.
- Catalog loading is all-or-nothing: failed catalog initialization blocks the workspace and offers **re-initialize**, separate from crop-plan refresh recovery.
- Catalogs are refetched on page mount/browser refresh, not automatically kept synchronized across already-open views.

## Verification evidence at closure

**Reported green suites:** 146 frontend Vitest tests and 119 backend pytest tests — **265 total**. Counts refer to the user's final execution, not an independently executed suite in this archive.

**Manual integration checks reported:**

- Create a new crop draft, navigate away and back, confirm the uncommitted draft is gone; commit a field and see the persistent crop card.
- Submit values to real SQLite, refresh and inspect effective values/history.
- Bypass browser validation: backend rejects negative and malformed values with HTTP 422.
- Introduce artificial database delay/contention: observe a known busy rejection, preserve draft, resubmit, and see previous edit in history.
- Switch client while a previous client read is in flight; the later context displays the appropriate data.
- Verify end-to-end integration after replacing static catalogs with real endpoints, including new-client editing.

**Test boundaries:** Backend service/API and frontend adapter/resolver suites are automated; cross-component browser workflows were verified manually. This lab did not add comprehensive automated browser E2E coverage.

## Decisions recorded

1. Keep frontend revision resolution; retrieve raw server records instead of moving inheritance into SQL/API.
2. Make each field edit append-only and refetch the authoritative bundle after confirmed writes.
3. Load five reference catalogs together before enabling the workspace; catalog failure has its own recovery.
4. Keep independent domain routers/catalog endpoints, including Forecast Years.
5. Keep explicit adapter contracts; crop-plan records use camelCase in the frontend, while read-only/non-append-only catalogs may retain snake_case.
6. Prefer focused pytest/Vitest + manual integrated walkthrough over a new general-purpose browser testing framework.

## Accepted limitations and deferred follow-ups

- **Stale-mutation notice:** `notice` is assigned by the current `Overview.jsx` for a superseded successful write, but no corresponding notice rendering appears in the reviewed component. Verify any visibility requirement before relying on this path for user communication.
- **Initial revision identity:** Draft creation and some URL operations use literal revision ID `1`. Revisit if catalog IDs become dynamic; `revision_order` is the conceptual business order.
- **Catalog freshness:** Metadata is a snapshot loaded on mount/re-initialization; it does not live-sync with changes made elsewhere during the same mounted session.
- **Authentication:** `current_user` is a temporary server-side provider, not a deployed authentication/authorization solution.
- **Forecast-engine alignment:** The earlier roadmap called for alignment of resolver tie-breaking with the Python forecast engine. This archive does not contain evidence that the Python engine was reconciled or integrated; track separately before forecast execution depends on these records.
- **Out of scope:** crop activation/deletion, catalog CRUD, completeness gating, cloud migration, forecast-engine execution, generalized caching, exhaustive browser automation, and cosmetic polish.

## Closure

**Lab 08 is closed for its Phase 1 experimental acceptance scope.** Carry forward the proven SQLite/FastAPI transaction patterns, catalog fetch adapters, server/client contracts, tests, and deliberate recovery taxonomy into the next configuration module (planned: QBO Input). Do not reopen this lab for optional refactoring unless a documented invariant fails.