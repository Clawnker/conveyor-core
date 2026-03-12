# Multi-Agent Adapter — Spec for conveyor-core

_Multi-agent orchestration adapter for conveyor-core_

## Problem
conveyor-core handles single-agent workflows well — one agent moves cards through stages with gates. But when you scale to multiple specialised agents, you hit problems that don't exist in single-agent setups:

- **Who owns what?** If 9 agents can all touch the same cards, you get chaos.
- **How do agents hand off?** When one agent finishes and another needs to review, there's no structured protocol.
- **How do you catch bad output before it ships?** Generic gates check "does a PR exist?" but not "is this SEO content actually good?"
- **How do you bring a new agent online safely?** Without a process, you're guessing.
- **How do you stop agents repeating each other's mistakes?** If Agent A already tried an approach that failed, Agent B shouldn't waste time on it.

## Solution: Three additions to conveyor-core

---

### 1. Agent Registry + Lane Isolation

Every agent gets declared in a registry with:
```js
{
  id: 'website-agent',
  role: 'Website & email automation',
  lane: ['web-*'],             // card prefixes this agent can touch
  capabilities: ['email', 'seo', 'web'],
  model: 'sonnet',             // default model tier
  channel: '#website',         // where this agent communicates
  status: 'online'             // online | onboarding | offline
}
```

**Lane isolation rule:** An agent can only move cards matching their lane prefix. Brain (orchestrator) can move any card. This prevents agents stepping on each other.

**Why this matters:** In a 9-agent fleet, without lane isolation you get two agents working the same card, conflicting commits, and wasted tokens. Lanes make ownership deterministic.

---

### 2. Lenses — Domain-Specific Quality Gates

conveyor-core's existing gate profiles check structural requirements (does a PR exist? is CI passing?). But they can't ask the hard questions — is this content what Google actually wants to see? Would a top agency do it differently? Is there a risk a quant would catch?

Every task has a different subject matter. A lens asks: **"Who is the highest authority in the world for THIS specific task — and what would THEY say?"**

Not a generic reviewer. Not a checklist. The #1 person on earth for that exact thing.

```js
// Blog post about local SEO
{
  domain: 'seo',
  name: 'seo-authority-review',
  authority: 'The head of SEO at the #1 ranked digital agency in the world',
  perspectives: [
    'What would they change about this page structure?',
    'What is missing that they would never ship without?',
    'How would they beat the current #1 ranked competitor?'
  ]
}

// Email campaign for lead generation
{
  domain: 'email',
  name: 'email-authority-review',
  authority: 'The CMO who built HubSpot\'s inbound marketing machine',
  perspectives: [
    'What would they change about this subject line?',
    'What is the conversion killer they would spot instantly?',
    'What would make this unmissable in a crowded inbox?'
  ]
}

// Trading signal evaluation
{
  domain: 'trading',
  name: 'risk-authority-review',
  authority: 'The chief risk officer at Renaissance Technologies',
  perspectives: [
    'What risk would they flag before this goes live?',
    'What correlation is being missed?',
    'What is the worst-case scenario nobody has modelled?'
  ]
}
```

The lens runs at the end of each task. Two outputs — both scoped to THAT specific task/script only:
1. **Output review** — what the authority would change about THIS deliverable
2. **Process optimisation** — how the authority would improve the way THIS specific task/script runs. Not the whole system. Not other agents. Just this one process.

Example: an SEO blog script finishes → the authority reviews the blog post (output) AND reviews how the script generated it (process). "Your keyword research step should come before outline generation, not after." Scoped. In its lane. No cross-system sprawl.

Agents define their own lens authorities per task when they come online (they know their domain best).

**The "Legal Agent" pattern:** Think of it like hiring a specialist consultant to review every piece of work before it ships. Not a junior doing a checklist — a senior expert asking the questions nobody else thinks to ask. In multi-agent systems, this is the **audit agent**:

- It doesn't build anything
- It doesn't own any cards
- It applies domain-expert lenses to other agents' output
- It produces optimisation suggestions, not just blockers
- A separate agent catches blind spots the builder can't see

```js
{
  id: 'audit',
  role: 'Domain-expert reviewer — applies lenses to all agent output',
  lane: ['*'],                 // can see everything, owns nothing
  capabilities: ['review'],
  lenses: ['seo', 'code', 'email', 'trading', 'legal'],
  canBlock: true,              // can block when quality is unacceptable
  canProduce: false            // never creates work, only reviews it
}
```

**Why not just use the same agent?** Because the same model with the same context will have the same blind spots. A separate agent with a review-only brief catches things the builder misses. Same reason you don't let a developer approve their own PR.

---

### 3. Structured Onboarding Protocol

When you add a new agent to the fleet, you need a repeatable process. Without one, each agent comes online with different assumptions, different file structures, different habits.

```
ONBOARDING STAGES:
  
  1. AUDIT (orchestrator)
     - Read every file in the new agent's workspace
     - Check: decision-log.md exists? failures.md exists? 
     - Check: git branch matches agent/<name> pattern?
     - Check: no files that belong in another agent's workspace?
     - Output: audit report with gaps identified
  
  2. BRIEF (orchestrator)  
     - Write an onboarding brief tailored to this agent
     - Include: role, boundaries, data sources, framework rules
     - Include: what's already built, what's broken, what's next
     - Place brief in agent's workspace
  
  3. BOOT (agent, on highest-tier model)
     - Agent reads: own workspace files + onboarding brief + global framework
     - Agent responds: "here's what I have, here's what I need, here's my plan"
     - Agent does NOT start building yet
  
  4. APPROVE (human)
     - Human reviews agent's plan on dashboard
     - Approves, rejects, or modifies
     - Only after approval does agent begin work
  
  5. VERIFY (orchestrator)
     - Test agent's output against lenses
     - Verify git commits landing on correct branch
     - Verify comms going to correct channel
     - Run for N cycles before considering agent stable
  
  6. OPTIMISE (orchestrator)
     - Once stable, evaluate if agent can drop to cheaper model
     - Monitor lens pass rate — if consistently passing, model downgrade is safe
     - If lens failures increase after downgrade, escalate back up
```

**Why start on the expensive model?** Because onboarding is where agents make the most mistakes. You want maximum capability while they're learning the workspace, the brief, the framework. Once they're stable and consistently passing lenses, you can safely drop them to a cheaper model. The lens pass rate IS the signal.

---

### 4. Cross-Agent Failure Memory

Each agent maintains their own `failures.md` (max 30 entries, categorised, self-pruning). The orchestrator can search across ALL agent failure logs.

```js
// Orchestrator assigns a card to Agent B
// Before assigning, check if any agent already failed on similar work:

const priorFailures = searchFailures({
  query: card.title,
  agents: ['*'],           // search all agents
  categories: ['API', 'CONFIG'],
  maxAge: '30d'
});

if (priorFailures.length > 0) {
  // Attach prior failures as context to the card
  card.context.priorFailures = priorFailures;
  // Agent B sees: "Agent A tried X on March 5, failed because Y"
}
```

**Why per-agent, not centralised?** Because centralised logs become a context bomb. Each agent searches their own log first (cheap, local). Only the orchestrator does cross-agent search (targeted, on-demand). 30 entries × 9 agents = 270 max, but no single agent ever loads more than 30.

---

## How It Fits conveyor-core

```
packages/
  core/              ← existing stages, gates, blockers
  adapters-github/   ← existing GitHub integration  
  multi-agent/       ← NEW
    src/
      registry.js    ← agent declarations + lane rules
      lenses.js      ← domain-specific quality gate runner
      onboarding.js  ← structured onboarding state machine
      failures.js    ← cross-agent failure search
      handoff.js     ← structured agent-to-agent transitions
    index.js
    package.json
```

No breaking changes to core. It's an adapter — you import what you need. Single-agent users aren't affected.

---

## What This Enables

| Before (single agent) | After (multi-agent) |
|---|---|
| One agent, one brain, one context | N specialised agents, each with domain expertise |
| Generic gates (PR exists? CI green?) | Domain-expert lenses ("what would Google want?", "what would a top agency do?") |
| Agent reviews own work | Dedicated audit agent applies expert perspectives the builder can't see |
| New agent = guess and hope | Repeatable 6-stage onboarding with model optimisation |
| Failure = lost in session | Failure = logged, searchable, cross-referenced |
| Agent conflicts on shared work | Lane isolation, deterministic ownership |
