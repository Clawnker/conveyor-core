# conveyor-core

Reusable workflow core for autonomous conveyor-style task execution.

## What it provides
- Stage model + forward transition rules
- Handoff/claim semantics
- Gate evaluation (blockers, evidence, signoff)
- Repo/no-repo routing contract
- Canary drill + run report reference patterns

## Intended users
Teams building Kanban-like automation dashboards who need deterministic gates and auditable movement.

## Modules (planned)
- `@conveyor/core` — state machine + gate engine
- `@conveyor/adapters-github` — issue/PR artifact adapter
- `@conveyor/starter` — starter app with intake/canary/report APIs

## Quick principles
1. Stage completion is not artifact completion.
2. Evidence and signoffs are first-class gates.
3. Repo routing must be explicit or policy-inferred + allowlisted.
4. Every autonomous move must be auditable.

## Status
Initial public scaffold extracted from production learnings.
