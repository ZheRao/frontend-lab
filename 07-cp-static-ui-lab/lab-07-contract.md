Here's the Lab 07 contract draft, then the fixture design, then a build order for the page. Items marked **(proposed)** need your yes or no. Everything else follows from the spec or from decisions we've already made.

# Lab 07 contract: Crop Plan Static UI

**Question:** Can all three screens, and every presentation state the spec names, be rendered from one resolved view-model shape, with no business logic in the components?

**In scope:** routes, the context gate, the overview, the crop editor, the field dialog, the Add Crop selection, and static fixtures.
**Out of scope:** resolution logic, mutations, async behavior, styling polish.

### Routing and context (decided)

| ID | Requirement |
|---|---|
| UI-01 | Routes are `/crop-plans` (overview) and `/crop-plans/:cropId` (crop editor), siblings under a pass-through `crop-plans` parent. |
| UI-02 | Context is `?client=&year=&revision=`. The URL is the only store for it, and no component holds a copy in `useState`. |
| UI-03 | **Context gate:** The context gate has three outcomes: complete and valid shows the data; partial shows the selectors with a “Select a client and forecast year” prompt in place of crops; invalid shows an invalid-context state. No outcome invents values. |
| UI-04 | Changing client or year sets `revision=1` in the same navigation. Changing revision keeps client and year. |
| UI-05 | Moving between screens preserves the query unchanged. Back to overview navigates to an explicit URL. |
| UI-06 | The crop editor validates `cropId` against the catalog. An unknown crop shows an invalid-crop state, not the router 404. |
| UI-07 | selections write only the keys that are set. The revision list is always shown, as a Lab 07 simplification. Changing client or year writes revision=1, but only once both are present. |
| UI-08 | Add Crop and Edit inputs are unavailable until the context is complete. The crop editor independently gates direct loads. |

### Overview

| ID | Requirement |
|---|---|
| UI-10 | Shows client and year selectors and **only** the available revisions for that context, with the selected revision highlighted. |
| UI-11 | Shows a "+ Add revision N" affordance for the next sequential revision. It's visual only in Lab 07. |
| UI-12 | Lists configured crops with a summary and an **Edit inputs** link. **(proposed)** The summary is current-year Acres and Yield/Acre, shown as `—` when missing. |
| UI-13 | Shows the empty state "No crops configured" when the fixture has none. Loading and read-error states render as distinct screens, never as empty. |
| UI-14 | **Add Crop (proposed):** an inline crop dropdown on the overview. Already-configured crops are either marked so that choosing one opens the existing editor, or removed from the list. Choosing a crop navigates to the editor and writes nothing. |

### Crop editor

| ID | Requirement |
|---|---|
| UI-20 | Shows a read-only context line, `Client · Year · Rev N · Label`, and has **no** revision control. |
| UI-21 | Renders all ten categories grouped Prior/Current. **Rows come from the category catalog, not from the data**, so a missing value still produces a row. |
| UI-22 | Shows three indicator states: **local** (green), **inherited** (grey, with source revision), and **missing** (no dot and `—`, with no source label). The indicator is derived the same way everywhere. The overview shows only local/inherited/missing. The crop editor also shows the source revision for inherited values. |
| UI-23 | Displays `0` as `0`, never `—`. |
| UI-24 | Shows a crop-selection draft (a catalog crop with no committed fields) with all ten rows as `—` and a "Draft" label. |
| UI-25 | Each row has an edit action that opens the field dialog. |

### Field dialog

| ID | Requirement |
|---|---|
| UI-30 | Is opened by component state with no route. It shows the crop, crop year, category, and full read-only context. |
| UI-31 | Shows the current effective value with provenance: "Saved in Rev 2", "Inherited from Rev 1", or "No existing input". |
| UI-32 | **(proposed)** For an inherited field, shows the source memo read-only and leaves the memo input blank. |
| UI-33 | **(proposed)** Shows history inside the dialog, below the form. It lists only the selected revision's rows, with a distinct empty state ("No edits in Rev 2") shown separately from the inherited-source line. |
| UI-34 | Save and cancel are visual only. Validation-error and pending states can be rendered from fixtures. |

# The fixture: one rule and four shapes

**The rule:** fixtures contain only what a backend read would return, and every visual state is *derived* from that. In particular, **the indicator color is never stored**. If a fixture held both `sourceRevisionId: 1` and `isInherited: false`, it could contradict itself, and the components would have no way to tell which value to trust.

**1. Reference data** (controlled catalogs):

```js
clients:      [{ id: "12", name: "Example Client" }, ...]
cropCatalog:  [{ id: "durum", name: "Durum" }, { id: "canola", name: "Canola" }, ...]
categories:   [{ cropYear: "prior", inputType: "quantity_inventory", label: "Quantity Inventory", unit: "bu" }, ...]  // all 10, in display order
```

**2. Available revisions** per client and year:

```js
[{ id: "1", order: 1, label: "Pre-seeding" }, { id: "2", order: 2, label: "Post-seeding" }]
```

**3. A resolved field** is either `null` (missing) or:

```js
{ value: 7461, memo: "Initial estimate", sourceRevisionId: "1", sourceVersionId: 101 }
```

Missing is `null`, which has **no provenance at all**. That's G-08 enforced by the shape itself. Zero is `{ value: 0, ... }`, which keeps the zero-vs-missing distinction structural rather than a matter of convention.

The indicator is derived at render time:
- the field is `null` → missing
- `sourceRevisionId === context.revision` → local
- anything else → inherited

**4. Reads per context.** Each crop-plan read contains the context, its revisions, and its crops. Each crop has `fields` keyed by `"current.acres"` and so on, plus `history` keyed the same way, with exact-revision rows only.

### Selecting fixtures by URL

Key the fixtures by context, so the URL picks the scenario and the routing gets exercised for free:

| URL context | Scenario | States it covers |
|---|---|---|
| client 12 · 2027 · rev 1 | Durum partial: local values plus missing ones, one zero | UI-22, UI-23 |
| client 12 · 2027 · rev 3 | Durum with some overrides; Canola rev 1 only, so all inherited | RES-01/03, UI-31 |
| client 13 · 2027 · rev 1 | No crops | UI-13 empty |
| client 99 or rev 7 | No fixture | UI-03 gate |
| `/crop-plans/flax?...` | Catalog crop with no fields | UI-24 draft |

For loading and read-error states, a temporary dev-only toggle is fine, since a static lab has no real requests.

**Numeric note (D-14):** values are JS numbers in the fixture for now. Don't format them in the fixture. Formatting is a display concern. If Lab 09 chooses a decimal string, only the fixture and the formatter change.

# Build order

1. **Write the fixture file first.** It's pure data, with no React. 
2. **Build the overview with the context gate.** Read the three params, look up the fixture, and render the gate state or the revisions and crop cards.
3. **Build the crop editor.** Iterate over `categories` and look up `fields[key]`. Write the indicator derivation as a small pure function, which becomes a Lab 08 test target.
4. **Build the field dialog.** Use your existing `<dialog>` pattern, with static history.
5. **Add Crop.**