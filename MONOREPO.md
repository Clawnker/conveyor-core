# Monorepo layout

- `packages/core` — workflow core primitives (stages, gates, blockers)
- `packages/adapters-github` — GitHub adapter contract + implementation
- `apps/starter` — reference app wiring core + adapter

## Quick start

```bash
npm install
npm run build
npm run test
npm run -w @conveyor/starter dev
```
