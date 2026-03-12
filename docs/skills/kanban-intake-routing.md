# Skill: kanban-intake-routing

Purpose: standardize how agents convert cross-channel signals into properly gated conveyor cards.

## When to use
- A message in another channel should become tracked work.
- A task needs intake routing with traceability to source context.

## Required behavior
1. Capture from source
   - Include source metadata:
     - `sourceChannelId`
     - `sourceMessageId`
     - `sourceUrl`
     - `sourceSummary`
     - `sourceAuthor` (if available)

2. Choose work type
   - `code`: repo + issue/PR/CI/review gates.
   - `ops|analysis|doc`: evidence + signoff + blockers (no PR/CI requirement).

3. Repo routing
   - Explicit repo target when known (`repoOwner/repoName/defaultBranch`).
   - If omitted, infer from context/project key when policy allows.
   - Always enforce allowlist guardrails.

4. Intake gate
   - External captures should include `triage-required` blocker.
   - Do not bypass triage by forcing forward transitions.

5. Output contract
   - Return card id, current stage, next required gate, and unresolved blockers.

## Anti-patterns
- Marking done with unresolved blockers.
- Treating non-code tasks as PR-driven workflows.
- Missing source backlink/evidence for captured work.
