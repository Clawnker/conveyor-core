/**
 * Onboarding — structured protocol for bringing agents online.
 *
 * Without a repeatable process, each new agent comes online with
 * different assumptions, file structures, and habits. This state
 * machine enforces a fixed sequence:
 *
 *   AUDIT → BRIEF → BOOT → APPROVE → VERIFY → OPTIMISE
 *
 * Key insight: agents start on the most capable (expensive) model
 * during onboarding because that's when they make the most mistakes.
 * Once stable and consistently passing lenses, they can safely
 * drop to a cheaper model. The lens pass rate IS the downgrade signal.
 */

const STAGES = ['audit', 'brief', 'boot', 'approve', 'verify', 'optimise', 'active'];

const STAGE_DESCRIPTIONS = {
  audit: 'Orchestrator reads every file in agent workspace. Checks decision-log, failures, git branch, file ownership.',
  brief: 'Orchestrator writes tailored onboarding brief. Includes role, boundaries, data sources, framework rules, current state.',
  boot: 'Agent comes online on highest-tier model. Reads workspace + brief + global framework. Reports what it has, needs, and plans. Does NOT start building.',
  approve: 'Human reviews agent plan (ideally on dashboard). Approves, rejects, or modifies. No work begins until approval.',
  verify: 'Orchestrator tests agent output against lenses. Verifies git commits on correct branch, comms on correct channel. Runs for N cycles.',
  optimise: 'Evaluate model downgrade. If lens pass rate is stable, drop to cheaper model. If failures increase after downgrade, escalate back.',
  active: 'Agent is fully online and operating within its lane.',
};

export function createOnboardingTracker() {
  const agents = new Map();

  return {
    /**
     * Start onboarding for an agent.
     */
    start(agentId) {
      agents.set(agentId, {
        agentId,
        stage: 'audit',
        startedAt: new Date().toISOString(),
        history: [{ stage: 'audit', at: new Date().toISOString() }],
        notes: {},
        lensPassRate: null,
      });
      return agents.get(agentId);
    },

    /**
     * Advance to the next onboarding stage.
     * Returns the new state, or null if already active.
     */
    advance(agentId, note) {
      const state = agents.get(agentId);
      if (!state) throw new Error(`Agent ${agentId} not in onboarding`);

      const ix = STAGES.indexOf(state.stage);
      if (ix >= STAGES.length - 1) return null; // already active

      const nextStage = STAGES[ix + 1];
      if (note) state.notes[state.stage] = note;
      state.stage = nextStage;
      state.history.push({ stage: nextStage, at: new Date().toISOString() });

      return state;
    },

    /**
     * Get current onboarding state for an agent.
     */
    get(agentId) {
      return agents.get(agentId) || null;
    },

    /**
     * Record lens pass rate during verify/optimise stages.
     * Used to decide if model downgrade is safe.
     */
    recordLensRate(agentId, passRate) {
      const state = agents.get(agentId);
      if (!state) return;
      state.lensPassRate = passRate;
    },

    /**
     * Check if model downgrade is safe based on lens pass rate.
     * Default threshold: 90% pass rate over verify period.
     */
    canDowngrade(agentId, threshold = 0.9) {
      const state = agents.get(agentId);
      if (!state || !state.lensPassRate) return false;
      return state.lensPassRate >= threshold;
    },

    stages: STAGES,
    descriptions: STAGE_DESCRIPTIONS,
  };
}
