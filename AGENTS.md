# AGENTS.md — conveyor-core contributor contract

This file defines how humans/agents should work in this repository.

## Mission
Build a reusable public framework for autonomous conveyor workflows that is:
- deterministic
- testable
- auditable
- safe by default

## Scope boundaries
- Keep private project specifics out of this repo.
- Implement generic abstractions, adapters, and starter examples.
- Avoid hard-coding org-internal secrets, IDs, or environment assumptions.

## Required workflow
1. Plan the change and state the target outcome.
2. Implement in the correct module (`core`, `adapters-*`, `multi-agent`, or `starter`).
3. Run verification before commit:
   - `npm run build`
   - `npm run test`
4. Commit with clear, scoped messages.
5. Keep README, spec, and repo guidance in sync with shipped behavior.

## Design rules
- Core package stays pure and framework-agnostic.
- Provider logic belongs in adapters.
- Multi-agent behavior should stay optional and adapter-scoped.
- Starter app demonstrates composition, not business lock-in.
- Prefer explicit policy objects and routing packets over implicit side effects.
- Route ownership should be represented as plain data (`pendingHandoff`, `activeClaim`, lane helpers), not hidden service state.

## Definition of done
A change is done when:
- behavior is implemented,
- build/test pass,
- docs reflect reality,
- starter/examples still match the public API,
- no private/internal-only assumptions leak into public artifacts.
