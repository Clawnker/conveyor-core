/**
 * Handoff Protocol — structured agent-to-agent transitions.
 *
 * When a card crosses agent boundaries (builder finishes → audit reviews),
 * the handoff must carry evidence, context, and a clear request.
 * Without this, the receiving agent wastes tokens figuring out what happened.
 */

export function createHandoff(registry, lensRunner) {
  return {
    /**
     * Initiate a handoff from one agent to another.
     * Validates lane permissions and applies lenses before transfer.
     *
     * @param {string} fromAgent - agent handing off
     * @param {string} toAgent - agent receiving
     * @param {Object} card - the conveyor card
     * @param {Object} evidence - work product / evidence packet
     * @param {Function} [checker] - lens reviewer function
     * @returns {{ accepted, card, lensResults, handoff?, reason }}
     */
    async initiate(fromAgent, toAgent, card, evidence, checker) {
      // Verify receiving agent can touch this card
      if (!registry.canTouch(toAgent, card)) {
        return {
          accepted: false,
          card,
          lensResults: null,
          reason: `Agent ${toAgent} cannot touch card ${card.id} (lane mismatch)`,
        };
      }

      // Verify receiving agent is online
      const receiver = registry.get(toAgent);
      if (!receiver || receiver.status !== 'online') {
        return {
          accepted: false,
          card,
          lensResults: null,
          reason: `Agent ${toAgent} is not online (status: ${receiver?.status || 'unknown'})`,
        };
      }

      // Lenses are advisory: they produce optimization suggestions for the
      // handoff packet but do not act as structural pass/fail gates here.
      let lensResults = null;
      if (checker && lensRunner) {
        lensResults = await lensRunner.apply(fromAgent, card.stage, evidence, checker);
      }

      // Build handoff packet
      const handoff = {
        from: fromAgent,
        to: toAgent,
        card,
        evidence,
        lensResults,
        handoffAt: new Date().toISOString(),
      };

      return {
        accepted: true,
        card,
        lensResults,
        handoff,
        reason: null,
      };
    },
  };
}
