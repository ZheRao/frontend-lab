# 01 — Task Tracker

A small React task-management application built to understand frontend behavior and JavaScript/React mechanisms through incremental experiments—not to build a production-ready task manager.

## Behaviors explored

- Display tasks; add, rename, and delete them through reusable components.
- Load tasks and simulate asynchronous CRUD requests with a fake API.
- Show loading and busy states, handle failures, and retry operations.
- Preserve unsaved edits during failed saves and complete the editing workflow after a successful retry.

## Concepts practiced

- **React fundamentals:** components, JSX, props, callbacks, controlled inputs, `useState`, and state ownership.
- **Rendering and identity:** list rendering with `.map()`, stable `key` values, re-renders versus unmount/remount, and preservation of local state.
- **JavaScript mechanics:** closures, function arguments, immutable array updates, Promises, `async`/`await`, and `try`/`catch`/`finally`.
- **Async UI management:** `useEffect` for initial loading, functional state updates, error dialogs, and retry callbacks.
- **Reusable orchestration:** a `runWrite()` helper centralizes busy state, error handling, cleanup, and retries while individual operations define their API calls and success behavior.
- **Concurrency basics:** `useRef` as a synchronous guard against overlapping writes, alongside `useState` for rendering disabled controls.

## Key lessons

- Define expected UI behavior and failure handling before choosing abstractions.
- Keep committed task data in shared state and temporary editing drafts in the row that owns the interaction.
- Retrying an API action is not always equivalent to retrying the full UI workflow.
- Unmounting a component or changing its `key` resets its local state; a normal re-render does not.
- Disabled controls improve the user experience but do not replace backend concurrency and data-integrity guarantees.

## Scope

This project uses a simulated backend. Real persistence, multi-user conflict handling, routing, pagination, and stale-response cancellation are intentionally left for future experiments when concrete feature requirements call for them.