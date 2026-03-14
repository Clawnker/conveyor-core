# Governance File Size Limits

## Problem
Agent governance files (AGENTS.md, SOUL.md, MEMORY.md, etc.) grow unbounded.
At scale, bloated context wastes tokens on every session start and leads to
agents ignoring rules buried in walls of text.

## Pattern: Hard Line Caps

Set a maximum line count per governance file. Enforce it as a constitutional
rule (agents treat it as a wall, not a suggestion).

Recommended limits (adjust to your setup):

| File | Max Lines | Overflow Target |
|------|-----------|----------------|
| SOUL.md | 60 | reference files |
| MEMORY.md | 80 | memory/archive/ or memory/reference-*.md |
| AGENTS.md | 40 | agent workspace docs |
| HEARTBEAT.md | 20 | scripts/ |
| TOOLS.md | 30 | memory/reference-tools.md |
| USER.md | 40 | memory/reference-user.md |

## Rules

1. **Hit the limit → move to overflow.** Never exceed the cap.
2. **Overflow files are searched, not loaded.** Use semantic search (memory_search)
   to pull relevant snippets on demand instead of loading everything at boot.
3. **Review caps quarterly.** If agents consistently need more, raise the cap.
   If files never approach the limit, tighten it.
4. **One file, one purpose.** If a file covers two topics, split it.

## Implementation

Add to your agent's constitutional rules:

```
## File Limits — CONSTITUTIONAL
SOUL 60 | MEMORY 80 | AGENTS 40 | HEARTBEAT 20 | TOOLS 30 | USER 40
Hit the limit → move to overflow. Never exceed.
```

This costs ~2 lines of context but saves hundreds of lines of bloat over time.

## Results (real-world)

Before limits: AGENTS.md was 212 lines. Agents ignored 80% of rules.
After limits: AGENTS.md is 41 lines. Every rule gets read and followed.
Token savings: ~60% reduction in governance context per session.
