/**
 * Agent Registry — declare agents, enforce lane isolation.
 *
 * Each agent gets a role, lane prefixes (card ownership), capabilities,
 * and a communication channel. The registry enforces that agents can
 * only move cards matching their lane.
 */

export function createRegistry() {
  const agents = new Map();

  return {
    register(agent) {
      if (!agent.id) throw new Error('Agent requires an id');
      if (!agent.role) throw new Error(`Agent ${agent.id} requires a role`);
      agents.set(agent.id, {
        id: agent.id,
        role: agent.role,
        lane: agent.lane || ['*'],
        capabilities: agent.capabilities || [],
        model: agent.model || 'default',
        channel: agent.channel || null,
        status: agent.status || 'offline',
        canBlock: agent.canBlock || false,
        canProduce: agent.canProduce !== false,
        lenses: agent.lenses || [],
      });
    },

    get(id) {
      return agents.get(id) || null;
    },

    list(filter = {}) {
      let result = [...agents.values()];
      if (filter.status) result = result.filter((a) => a.status === filter.status);
      if (filter.capability) result = result.filter((a) => a.capabilities.includes(filter.capability));
      return result;
    },

    /**
     * Check if an agent is allowed to touch a card based on lane prefixes.
     * Lane ['*'] = orchestrator, can touch anything.
     * Lane ['web-*'] = can only touch cards with id starting 'web-'.
     */
    canTouch(agentId, card) {
      const agent = agents.get(agentId);
      if (!agent) return false;
      if (agent.lane.includes('*')) return true;
      return agent.lane.some((prefix) => {
        const pattern = prefix.replace('*', '');
        return card.id.startsWith(pattern) || (card.projectKey && card.projectKey.startsWith(pattern));
      });
    },

    setStatus(agentId, status) {
      const agent = agents.get(agentId);
      if (!agent) throw new Error(`Agent ${agentId} not found`);
      agent.status = status;
    },
  };
}
