# 07 — Crop Plan Frontend Lab

**Status:** Complete as a frontend prototype (2026-11-14)  
**Next:** 08 — Crop Plan Backend & Integration Lab

## Engineering question

Can a single Crop Plan overview support context-driven crop input configuration, revision inheritance, field-level history, and an asynchronous append-and-refresh workflow using an in-memory service, without a real backend?

## Scope and outcome

This lab grew beyond the original static-UI scope and now includes the frontend mechanics and a simulated asynchronous service. It establishes:

- A single overview route, `/crop-plans?client=...&year=...&revision=...`, with client/year selection and URL-driven revision selection. No fallback context is silently selected when URL parameters are missing.
- Crop cards grouped into **Plant · Current Year**, **Inflow · Prior Year**, and **Outflow · Current Year Costs**. All ten fixed categories render, including missing fields.
- Field buttons opening one modal for effective value, provenance, memo, draft input, and selected-revision edit history. The separate crop-editor route was removed as redundant.
- A crop dropdown that adds an **ephemeral draft card** with missing inputs. New crop drafts begin in Revision 1; the first confirmed append makes the crop visible from loaded data.
- A pure, deterministic revision resolver, with focused automated tests and catalog-consistency tests.
- Fake asynchronous `getCropPlan(clientId, forecastYear)` and `createRecord(payload)` services; appending a new version is followed by a fresh read, resolution, and render.
- Frontend request state (`idle`, `loading`, `pending`, `success`), request-generation counters, a mutation lock, a read-generation counter, and initial validation/error-recovery scaffolding.

## Important design decisions

1. **URL is context authority.** Client, forecast year, and revision are read from search parameters. Changing client/year resets revision to 1. A partial/invalid URL does not render crop data.
2. **One loaded workspace.** `loadedPlan` stores `{ clientId, forecastYear, rows }`. Values are displayed only if the loaded context matches the URL. Changing client/year triggers a read; changing revision re-resolves the existing bundle.
3. **Derived, not duplicated, values.** `resolvedData` is computed from loaded rows and the selected revision; it is not separately stored in state.
4. **Append-only versions.** An edit generates a new record; existing versions remain. Zero is a valid committed value, distinct from a missing field.
5. **Revision precedence.** Eligible rows have revision order no greater than the requested revision; higher revision order wins, then highest committed numeric ID within that revision.
6. **History scope.** History in the field dialog contains only the selected revision's committed versions, newest first, including the effective record when it is local. Inherited-source versions are not misrepresented as local history.
7. **Ephemeral drafts.** The field dialog owns its local value/memo draft. Closing the dialog unmounts it and discards that draft; refreshing clears crop and field selection state.
8. **Revision availability shortcut.** The prototype shows only Revision 1 when the resolved plan is empty and all four predefined revisions once crop data exists; there is no revision-creation registry or command in this prototype.
9. **Mutation lifecycle ownership.** A standalone refresh owns `loading → idle`, while a refresh belonging to a write leaves overall mutation state ownership with `runWrite` (`pending → success/error`).

## Implementation map

| File | Responsibility |
|---|---|
| `Overview.jsx` | URL context, loaded bundle, async workflows, derived data, edit selection, crop drafts and dialogs |
| `CropCard.jsx` | Three semantic sections; renders all controlled category slots |
| `CropField.jsx` | Selectable field, displayed value/unit, provenance indicator and accessible label |
| `FieldEditModal.jsx` | Field-level draft, current effective value/source, selected-revision history |
| `helpers.js` | URL-state classification, resolver, number/date display formatting |
| `sampleData.js` | Clients, crops, revisions, categories and card group catalog |
| `fakeApi.js` | Module-local fake database and delayed read/append operations |
| `*.test.js` | Resolver invariants and catalog structural invariants |

## Resolution pipeline

`URL client/year → getCropPlan → loadedPlan → URL-context match → resolver(rows, revision) → CropCard/CropField/FieldEditModal`

The resolver is pure: it enriches copies of records with category metadata and revision order, filters out future revisions, sorts by **revision order descending, numeric record ID descending**, and allocates the first eligible record per `(cropId, categoryKey)` as the effective record. Only same-selected-revision records enter that category's `history` array. A nonexistent category is absent from the output; the category catalog causes the UI to display `—`.

## Verification

Automated resolver scenarios exercised during the lab include:

- Inheritance from revision 1 to a later revision; local override beats inherited value.
- Independent category/crop inheritance; future revisions excluded.
- Zero override vs missing data; equal timestamps resolved by numeric ID.
- Revision precedence outranks a higher ID from an earlier revision.
- Exact-revision history, including all local edits newest-first, without earlier-revision leakage.
- Empty input and invalid target produce `{}`; resolver leaves input data unchanged.

Catalog tests check category group coverage and uniqueness, controlled IDs, and revision-order uniqueness.

Manual scenarios explored include selecting and refreshing URL contexts, editing a field, write → refresh → updated card, and a draft crop becoming a configured crop. A duplicate draft/committed card defect was identified and corrected by clearing draft state during refresh.

Run the actual project test command (typically `npm test` or `npx vitest run` depending on repository scripts); confirm the command from `package.json`. No complete test-run transcript is attached to this README.

## Known limitations / deferred to Lab 08

- Fake reads and writes are module-memory operations; there is no persistence across full application/server restart and no cross-user consistency guarantee.
- Error classification and recovery branches exist as scaffolding but comprehensive validation, backend/HTTP failures, ambiguous commit outcomes, stale completion, and concurrent-navigation cases are **not yet fully tested**.
- Fake service failure toggles are currently disabled with `if (false)`; the existence of error UI does not establish verified failure handling.
- Read-side generation checks prevent an older read from overwriting a newer result, but status transitions and context changes still require integration tests.
- No server-authoritative numeric precision, controlled reference integrity, transactional persistence, or production audit identity yet.
- The current JS resolver is a prototype. When backend integration lands, choose one authoritative resolution contract and compare outputs against existing resolver test vectors rather than maintaining competing unverified implementations.
- The static year list and prototype revision display policy are intentional shortcuts.
- `formatValue()` formats integers with zero decimals and other values with two decimals; it is presentation formatting, not a numerical precision guarantee.

## Lab 08 handoff

Keep the UI interaction contracts and resolver test vectors. Implement append-only SQLite services, Pydantic/FastAPI validation, read/write HTTP contracts and errors, backend-authoritative effective values/history, then replace `fakeApi.js` with the real adapter. Prioritize pytest database/API correctness and focused Vitest adapter/request tests; verify read-after-write, stale requests, recovery, and client management regression behavior.

**Exit assessment:** Lab 07's working in-memory crop-plan frontend is complete. Reliable database-backed mutation/error handling remains the explicit Lab 08 objective.