# Monorepo layout

- `packages/core` — workflow core primitives (stages, blockers, decision logs, lane-aware routing helpers)
- `packages/adapters-github` — GitHub adapter contract scaffold
- `packages/multi-agent` — optional multi-agent coordination adapter with registry, lenses, onboarding, failures, and structured handoffs
- `apps/starter` — minimal runnable example of lane-aware create / handoff / claim flow

## Quick start

```bash
npm install
npm run build
npm run test
npm run -w @conveyor/starter dev
```
