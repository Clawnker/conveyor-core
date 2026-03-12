# conveyor-core specification (v0)

## Card schema
- id, title, stage, priority, projectKey
- workType: code|ops|analysis|doc
- optional repo target: repoProvider, repoOwner, repoName, defaultBranch
- evidenceLinks, evidencePackets, signOffs
- blockers[] with resolvedAt

## Gate profiles
### Code profile
Requires by stage:
- review+: issueUrl
- qa+: prUrl
- done: ciStatus=passing, review approval, evidence

### Non-code profile
Requires by done:
- evidence present
- required signoff (policy-defined)
- zero unresolved blockers

## Core invariants
- forward moves require active claim
- same actor cannot perform consecutive forward transitions (unless override policy)
- done does not bypass unresolved blockers

## Audit events
- handoff_requested
- handoff_claimed
- lane_worker_ran
- stage_moved
- auto_blocked
- evidence_validated
- linked_artifacts_closed
