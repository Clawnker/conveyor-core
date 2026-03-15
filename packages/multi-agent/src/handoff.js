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
     * @param {string|Object} toAgent - agent receiving or structured routing target
     * @param {Object} card - the conveyor card
     * @param {Object} evidence - work product / evidence packet
     * @param {Function} [checker] - lens reviewer function
     * @returns {{ accepted, card, lensResults, handoff?, reason }}
     */
    async initiate(fromAgent, toAgent, card, evidence, checker) {
      const target = normalizeHandoffTarget(fromAgent, toAgent, evidence, registry);

      // Verify receiving agent can touch this card
      if (target.toAgentId && !registry.canTouch(target.toAgentId, card)) {
        return {
          accepted: false,
          card,
          lensResults: null,
          reason: `Agent ${target.toAgentId} cannot touch card ${card.id} (lane mismatch)`,
        };
      }

      // Verify receiving agent is online
      const receiver = target.toAgentId ? registry.get(target.toAgentId) : null;
      if (target.toAgentId && (!receiver || receiver.status !== 'online')) {
        return {
          accepted: false,
          card,
          lensResults: null,
          reason: `Agent ${target.toAgentId} is not online (status: ${receiver?.status || 'unknown'})`,
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
        to: target.toAgentId,
        card,
        evidence,
        lensResults,
        handoffAt: target.requestedAt,
        toAgentId: target.toAgentId,
        toLane: target.toLane,
        intent: target.intent,
        evidenceSummary: target.evidenceSummary,
        requestedBy: target.requestedBy,
        requestedByLane: target.requestedByLane,
        requestedAt: target.requestedAt,
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

function normalizeHandoffTarget(fromAgent, toAgent, evidence, registry) {
  const source = typeof toAgent === 'string' ? { toAgentId: toAgent } : (toAgent || {});
  const sender = registry.get(fromAgent);

  return {
    toAgentId: cleanString(source.toAgentId ?? source.toAgent ?? source.to ?? null),
    toLane: cleanString(source.toLane ?? source.targetLane ?? source.lane ?? null),
    intent: cleanString(source.intent ?? null),
    evidenceSummary: cleanString(source.evidenceSummary ?? source.summary ?? evidence?.summary ?? null),
    requestedBy: cleanString(source.requestedBy ?? source.fromAgentId ?? source.from ?? fromAgent ?? null),
    requestedByLane: cleanString(source.requestedByLane ?? source.fromLane ?? firstLane(sender?.lane) ?? null),
    requestedAt: cleanString(source.requestedAt ?? source.handoffAt ?? null) || new Date().toISOString(),
  };
}

function firstLane(value) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
