# @conveyor-core/multi-agent

Optional adapter package for lane-isolated multi-agent workflows on top of `@conveyor/core`.

## Included modules
- `registry` for agent declarations and lane isolation
- `lenses` for advisory review passes
- `onboarding` for structured bring-up flows
- `failures` for per-agent failure memory
- `handoff` for structured agent-to-agent routing packets

## Structured handoff packet
`createHandoff(...).initiate(...)` remains backwards compatible with the old `toAgent` string, but it also accepts a routing target object.

Normalized handoff fields:
- `toAgentId`
- `toLane`
- `intent`
- `evidenceSummary`
- `requestedBy`
- `requestedByLane`
- `requestedAt`

The returned packet still includes legacy `from`, `to`, and `handoffAt` fields so existing consumers do not have to migrate all at once.

```js
const result = await handoff.initiate(
  'builder',
  {
    toLane: 'review',
    intent: 'request-review',
    evidenceSummary: 'Tests linked and changelog attached',
    requestedAt: '2026-04-01T12:00:00.000Z',
  },
  card,
  evidence
);
```

If `toAgentId` is provided, the adapter validates lane access and receiver status. If the handoff targets only a lane, the packet stays structured without forcing a specific receiver selection.
