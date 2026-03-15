# Starter implementation notes

`apps/starter` is intentionally tiny. It is not a product shell or demo UI.

## What it demonstrates now
- create a card with a stage-derived default lane
- request a structured handoff using plain routing data
- claim work by satisfying the routing target
- keep the whole flow in pure JavaScript with no network or provider dependency

Run it directly:

```bash
node apps/starter/src/index.js
```

Expected output includes:
- created lane
- handoff lane
- whether the review lane was targeted
- whether the reviewer can claim
- the active claim lane after claim

## Extension rule
If you expand the starter, keep it reference-grade:
- no product-specific UI
- no private repo assumptions
- no hidden background services
- prefer small, inspectable examples over feature sprawl
