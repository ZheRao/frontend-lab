# 02 — UI State Lab

## Purpose

A small React learning experiment focused on **UI state modeling, ownership, transitions, and interaction coordination**.

The objective is to close specific knowledge gaps before implementing Strata's Client CRUD, **not to engineer a complete production application**.

## Project: Meeting Room Reservation Manager

Build a minimal interface for managing fictional meeting room reservations.

Core interactions:
- View a list of reservations.
- Create a reservation through an Add modal.
- Rename a reservation inline.
- Simulate pending operations, validation errors, and request failures.
- Manage blocking overlays, focus, and keyboard interactions.

All data and simulated outcomes remain local. No backend or database.

## Learning Objectives

1. Model independent and mutually exclusive UI states.
2. Define valid transitions and prevent contradictory states.
3. Determine state ownership across React components.
4. Understand draft preservation, cancellation, and component lifecycle.
5. Coordinate modals, loading overlays, and error dialogs.
6. Manage focus, keyboard accessibility, and background interaction blocking.
7. Practice `useState`, conditional rendering, and `useRef` where appropriate.

## Behavioral Reference

Reuse the relevant invariants from Strata's `01-client-crud.md`:

- **G-04:** One active editing/action context.
- **G-05:** One pending mutation; prevent duplicate submissions.
- **G-06:** Successful mutation resets feature-level UI state.
- **G-07:** Confirmed failure preserves recoverable drafts.
- **G-11:** Only the topmost modal is interactive.

## Learning Process

1. Model UI states and transitions.
2. Design minimal component and state ownership boundaries.
3. Implement incrementally and experiment with the mechanisms.
4. Verify behavior and summarize lessons learned.

## Out of Scope

Real HTTP requests, database persistence, authentication, reservation conflict detection, production styling, and comprehensive automated testing.

Request timeouts, HTTP contracts, database integrity, and automated testing are addressed in subsequent experiments.

## Completion Criteria

The experiment is complete when the intended UI states and transitions behave consistently, drafts follow the required lifecycle, blocking layers isolate interaction, and the underlying React mechanisms can be explained confidently.