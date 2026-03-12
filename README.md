# conveyor-core

Reusable workflow core for autonomous conveyor-style task execution.

## Purpose
`conveyor-core` is a public reference project for teams building deterministic, auditable task conveyors with:
- stage-based movement
- explicit gates (evidence, signoff, blockers)
- repo-aware routing for code work
- non-repo paths for ops/analysis/doc work

## Current repository status
This repo is an **early scaffold** with working package layout and starter entrypoint.

### Included now
- `packages/core`
  - stage constants
  - next-stage helper
  - unresolved blocker helper
- `packages/adapters-github`
  - adapter contract scaffold
- `apps/starter`
  - minimal starter wiring of core + github adapter
- `docs/skills/kanban-intake-routing.md`
  - reusable agent playbook for intake routing

### Planned next
- richer gate engine in `@conveyor/core`
- concrete GitHub adapter actions (issue/PR lifecycle)
- starter API routes for intake/canary/report

## Monorepo layout
- `packages/core` — workflow primitives and (eventually) gate engine
- `packages/adapters-github` — GitHub integration adapter
- `apps/starter` — runnable reference implementation
- `docs/skills` — portable operator/agent skill docs

## Quick start
```bash
npm install
npm run build
npm run test
npm run -w @conveyor/starter dev
```

## Principles
1. Stage completion is not artifact completion.
2. Evidence and signoffs are first-class gates.
3. Repo routing must be explicit or policy-inferred + allowlisted.
4. Every autonomous move should produce auditable events.
