# conveyor-core specification (v0)

## Card schema
- `id`, `title`, `stage`, `priority`, `projectKey`
- `workType`: `code|ops|analysis|doc`
- optional repo target: `repoProvider`, `repoOwner`, `repoName`, `defaultBranch`
- `evidenceLinks`, `evidencePackets`, `signOffs`
- `blockers[]` with `resolvedAt`
- optional routing context:
  - `pendingHandoff`
  - `activeClaim`
  - `routing.currentLane`

## Lane-aware routing primitives
Core routing stays deliberately small and pure.

### Default lanes by stage
- `intake`, `scoped` -> `intake`
- `in_progress` -> `delivery`
- `review`, `qa` -> `review`
- `done` -> `done`

### Pending handoff packet
Normalized shape:
- `toAgentId`
- `toLane`
- `intent`
- `evidenceSummary`
- `requestedBy`
- `requestedByLane`
- `requestedAt`

### Active claim packet
Normalized shape:
- `actorId`
- `actorLane`
- `claimedAt`

### Pure routing checks
- `claimMatchesRoutingTarget(actor, handoff)` returns true only when the claim satisfies every routing constraint present on the handoff.
- `pendingHandoffTargetsRouting(cardOrContext, target)` checks whether a card or context currently points at a specific agent or lane target.

## Gate profiles
### Code profile
Requires by stage:
- `review+`: `issueUrl`
- `qa+`: `prUrl`
- `done`: `ciStatus=passing`, review approval, evidence

### Non-code profile
Requires by `done`:
- evidence present
- required signoff (policy-defined)
- zero unresolved blockers

## Core invariants
- forward moves require an active claim
- same actor cannot perform consecutive forward transitions unless override policy allows it
- `done` does not bypass unresolved blockers
- routing helpers do not fetch, mutate, or assign work; they only normalize and compare routing data

## Audit events
- `handoff_requested`
- `handoff_claimed`
- `lane_worker_ran`
- `stage_moved`
- `auto_blocked`
- `evidence_validated`
- `linked_artifacts_closed`
