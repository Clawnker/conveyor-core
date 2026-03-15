# conveyor-core

Reusable public workflow primitives for deterministic, auditable conveyor-style execution.

## Purpose
`conveyor-core` stays intentionally small:
- stage movement helpers
- blocker and decision log primitives
- lane-aware routing helpers for handoff and claim decisions
- optional adapters layered on top of the core

The repo is framework-agnostic. It provides pure helpers and reference adapters, not a service or product shell.

## Included now
- `packages/core`
  - stage constants and `nextStage`
  - blocker and decision log helpers
  - lane-aware routing primitives:
    - `defaultLaneForStage(stage)`
    - `normalizePendingHandoff(input)`
    - `normalizeActiveClaim(input)`
    - `claimMatchesRoutingTarget(actor, handoff)`
    - `pendingHandoffTargetsRouting(cardOrContext, target)`
- `packages/adapters-github`
  - adapter contract scaffold
- `packages/multi-agent`
  - registry, lenses, onboarding, failure memory, and structured handoff packets
- `apps/starter`
  - tiny runnable example showing lane-aware create, handoff, and claim behavior

## Monorepo layout
- `packages/core` — public workflow primitives
- `packages/adapters-github` — provider adapter scaffold
- `packages/multi-agent` — optional multi-agent coordination adapter
- `apps/starter` — minimal composition example
- `docs/skills` — reusable operator and agent playbooks

## Quick start
```bash
npm install
npm run build
npm run test
npm run -w @conveyor/starter dev
```

## Routing model
The public core keeps routing coarse on purpose. Stages imply default lanes:

| Stage | Default lane |
|---|---|
| `intake`, `scoped` | `intake` |
| `in_progress` | `delivery` |
| `review`, `qa` | `review` |
| `done` | `done` |

Handoffs and claims remain plain data. The core only helps normalize and compare routing targets:

```js
import {
  defaultLaneForStage,
  normalizePendingHandoff,
  normalizeActiveClaim,
  claimMatchesRoutingTarget,
} from '@conveyor/core';

const handoff = normalizePendingHandoff({
  toLane: defaultLaneForStage('review'),
  intent: 'request-review',
  requestedBy: 'builder-1',
  requestedByLane: defaultLaneForStage('in_progress'),
});

const claim = normalizeActiveClaim({
  actorId: 'reviewer-1',
  actorLane: 'review',
});

claimMatchesRoutingTarget(claim, handoff); // true
```

## Principles
1. Keep core logic pure and testable.
2. Prefer explicit routing targets over hidden state.
3. Keep provider logic in adapters.
4. Treat handoffs, claims, and stage moves as auditable data.
