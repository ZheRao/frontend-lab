# 06 — React Router Lab

## 1. Overview

**Primary engineering question:** How can independent configuration pages coexist in a navigable application without breaking existing Client Management functionality?

**Outcome:** A multi-page React application with a persistent layout, collapsible sidebar, URL-driven navigation, and independently maintained feature components.

**Duration:** Approximately 1.5 days.

**Status:** Complete.

This experiment transforms the existing standalone Client Management application into a multi-page application shell capable of hosting additional configuration features.

The experiment deliberately separates repository restructuring, static component composition, and React Router integration to make each architectural change independently understandable and verifiable.

## 2. Scope and Boundaries

### In scope

- Extract existing Client Management code into a self-contained feature directory.
- Create a reusable application shell with a persistent sidebar and main content area.
- Introduce a static welcome page and placeholder Crop Plan Configuration page.
- Implement collapsible sidebar behavior.
- Replace in-memory page selection with URL-driven navigation using React Router.
- Support direct URL loading, refresh, browser Back/Forward, and unknown routes.
- Verify preservation of existing Client Management behavior, including navigation during pending mutations.

### Out of scope

- Crop Plan Configuration business mechanics.
- Crop input data persistence.
- Authentication and authorization.
- Global application state management.
- Router-managed data loading and mutation actions.
- Production deployment configuration.
- Final visual design and responsive styling.

## 3. Experiment Progression

### 06.1 — Repository Restructuring

**Question:** Can Client Management be extracted into an independent feature without changing its behavior?

Moved the existing Client Management components, API adapter, and associated tests into `src/features/clients/`.

Renamed the original `App.jsx` to `ClientManagement.jsx` and introduced a new application-level `App.jsx`.

**Verification:**
- Existing frontend tests passed.
- Existing backend tests passed.
- Client Management rendered correctly.
- Normal CRUD workflows remained functional.

**Outcome:** Client Management became a feature-level component, independent of application-level navigation.

### 06.2 — Static Application Shell

**Question:** How can a persistent application layout host independent pages?

Introduced `AppLayout.jsx`, `Sidebar.jsx`, and page-level components.

Initially implemented navigation using `currentPage` state in `App.jsx` and callbacks passed through component props.

A declarative page registry provided metadata for selecting pages and generating navigation controls.

Implemented sidebar collapse behavior with state owned by `AppLayout`, allowing the sidebar's collapse button and the main content's expand button to coordinate through a common parent.

**Key mechanisms:**
- Component composition using `children`.
- Passing callbacks through props.
- Lifting shared state to the nearest common ancestor.
- Separating page-level responsibilities from feature-level responsibilities.
- Conditional component rendering.

**Outcome:** A functional multi-page shell without introducing a routing library.

### 06.3 — React Router Integration

**Question:** How can URL-based routing replace manual page-selection state?

Integrated React Router in Declarative Mode.

Replaced `currentPage` state and manual component selection with route definitions and nested routes.

Introduced:
- `BrowserRouter` for browser routing context.
- `Routes` and `Route` for URL-to-component mapping.
- `Outlet` for rendering matched pages inside the persistent application layout.
- `NavLink` for sidebar navigation and active-state styling.
- `Link` for navigation from welcome-page cards.
- A wildcard route for unknown URLs.

Created `src/app/navigation.js` as a shared metadata registry for sidebar links and welcome-page cards.

Route definitions remain explicit and separate from navigation metadata.

**Outcome:** Browser URLs became the source of truth for page selection.

### 06.4 — Integration and Lifecycle Verification

**Question:** Does route navigation preserve coherent behavior when existing Client Management operations are unresolved?

Tested delayed client creation requests while navigating away from Client Management.

Observed scenarios:

1. Delayed a client creation request by approximately five seconds.
2. Selected Stop Waiting after approximately two seconds and navigated to another page.
3. Returned to Client Management after the request completed.
4. Confirmed that the newly created record appeared in the refreshed client list.

A separate test used the browser Back button while the pending dialog was displayed. Returning to Client Management also displayed the completed mutation result.

**Outcome:** The tested navigation sequences did not produce stale client records or prevent the committed mutation from being observed.

**Boundary:** These observations validate the tested scenarios, not every possible asynchronous race condition. Navigating away does not inherently guarantee cancellation of an already-submitted server mutation.

## 4. Final Architecture

```text
src/
├── main.jsx
├── App.jsx
├── app/
│   └── navigation.js
├── layouts/
│   ├── AppLayout.jsx
│   ├── Sidebar.jsx
│   └── layouts.css
├── pages/
│   ├── HomePage.jsx
|   ├── HomePage.css
│   ├── ClientPage.jsx
│   ├── CropPlanPage.jsx
|   ├── NotFoundPage.css
│   └── NotFoundPage.jsx
└── features/
    └── clients/
        ├── ClientManagement.jsx
        ├── ClientManagement.css
        ├── ClientList.jsx
        ├── ClientRow.jsx
        ├── Modals.jsx
        ├── clientApi.js
        └── clientApi.test.js
```

Additional existing project files are omitted.

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `main.jsx` | React application initialization and router context |
| `App.jsx` | Route definitions and page composition |
| `AppLayout.jsx` | Persistent application layout and sidebar visibility state |
| `Sidebar.jsx` | Navigation presentation and interaction |
| `navigation.js` | Shared navigation metadata |
| `pages/*` | Page-level entry points |
| `features/clients/*` | Client Management behavior, API interactions, and associated UI |

### Navigation Structure

| URL | Page |
|---|---|
| `/` | Home |
| `/clients` | Client Management |
| `/crop-plans` | Crop Plan Configuration placeholder |
| Any unmatched URL | Not Found |

All routes share the application layout.

## 5. Architectural Decisions

### AD-01 — Keep feature behavior independent of application navigation

Client Management remains responsible for its own CRUD state, API interactions, and error handling.

Application routing does not require feature-specific business logic.

### AD-02 — Separate layout state from routing state

`AppLayout` owns sidebar visibility state.

React Router owns URL-based page selection.

Neither requires global application state management.

### AD-03 — Keep route definitions explicit

Routes are declared in `App.jsx`.

Navigation metadata is defined separately in `navigation.js`, allowing the sidebar and welcome page to reuse labels and destinations without making every route a navigation item.

### AD-04 — Use Declarative Mode

The application uses React Router for URL matching, navigation, and layout composition.

Router-managed loaders, actions, and more advanced routing mechanisms are deferred until justified by future requirements.

### AD-05 — Preserve component lifecycle semantics

Navigating between independent pages ordinarily unmounts the previous page component.

Local UI state may be reset on return.

Persistent client records remain server-owned and are retrieved through the existing Client Management loading mechanism.

Navigation blocking and preservation of unfinished form drafts are deferred.

## 6. Verification Summary

| Verification | Result |
|---|---|
| Existing frontend tests | Passed |
| Existing backend tests | Passed |
| Existing Client Management workflows | Passed |
| Sidebar navigation | Passed |
| Welcome-page navigation cards | Passed |
| Direct route loading | Passed |
| Browser refresh on routes | Passed |
| Browser Back/Forward | Passed |
| Unknown-route fallback | Passed |
| Sidebar collapse across navigation | Passed |
| Navigation during delayed client creation | Passed in tested scenarios |
| Returning to observe committed records | Passed in tested scenarios |

## 7. Reusable Outcomes

This experiment establishes:

1. A reusable multi-page application shell.
2. Independent feature and page ownership boundaries.
3. Nested routing with a persistent application layout.
4. A lightweight navigation metadata convention.
5. An established pattern for adding future configuration pages.
6. A basic understanding of route-driven component mount/unmount behavior.

The application is now structurally prepared for the Crop Plan Configuration experiments without requiring additional application-level routing changes for the initial overview page.

## 8. Deferred Considerations

- Route parameters for client-specific and forecast-year-specific configuration views.
- Navigation blocking during unresolved mutations or unsaved edits.
- Preservation of local form drafts across route changes.
- Production SPA fallback configuration.
- Authentication and authorization.
- Responsive layout refinements and final visual styling.
- Automated browser-level navigation tests, if later justified.

These are intentionally excluded from the current experiment.

## 9. Exit Gate

**Passed.**

The application provides a functional multi-page shell with persistent navigation, URL-driven routing, working browser history, and preserved Client Management functionality.

The Crop Plan Configuration placeholder is accessible and ready to be expanded in subsequent experiments.

**Next:** Crop Plan Configuration — static UI and in-memory data prototype.