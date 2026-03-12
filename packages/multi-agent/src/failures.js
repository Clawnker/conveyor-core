/**
 * Cross-Agent Failure Memory.
 *
 * Each agent maintains their own failure log (max entries, categorised,
 * self-pruning). The orchestrator can search across ALL agents' logs.
 *
 * Why per-agent, not centralised? Centralised logs become a context bomb.
 * Each agent searches their own log first (cheap, local). Only the
 * orchestrator does cross-agent search (targeted, on-demand).
 * 30 entries × 9 agents = 270 max, but no single agent ever loads > 30.
 */

const CATEGORIES = [
  'SEO', 'ENGINE', 'EMAIL', 'TRADING', 'DASHBOARD',
  'DEPLOY', 'API', 'AUTH', 'CONFIG', 'DATA', 'OPS',
];

export function createFailureStore(maxPerAgent = 30) {
  const stores = new Map();

  return {
    /**
     * Log a failure for a specific agent.
     * Auto-prunes oldest when limit is reached.
     */
    log(agentId, failure) {
      if (!failure.category || !failure.description || !failure.lesson) {
        throw new Error('Failure requires category, description, and lesson');
      }
      if (!stores.has(agentId)) stores.set(agentId, []);
      const agentStore = stores.get(agentId);

      agentStore.push({
        category: failure.category,
        description: failure.description,
        lesson: failure.lesson,
        date: failure.date || new Date().toISOString(),
        agentId,
      });

      // Self-prune: drop oldest when over limit
      while (agentStore.length > maxPerAgent) {
        agentStore.shift();
      }
    },

    /**
     * Search a single agent's failures.
     */
    searchAgent(agentId, query = {}) {
      const agentStore = stores.get(agentId) || [];
      return filterFailures(agentStore, query);
    },

    /**
     * Cross-agent search — orchestrator queries all (or specific) agents.
     * This is the expensive operation; use targeted queries.
     */
    searchAll(query = {}) {
      const targetAgents = query.agents || [...stores.keys()];
      const results = [];

      for (const agentId of targetAgents) {
        if (agentId === '*') {
          // Wildcard: search all
          for (const [id, store] of stores) {
            results.push(...filterFailures(store, query));
          }
          break;
        }
        const store = stores.get(agentId) || [];
        results.push(...filterFailures(store, query));
      }

      return results;
    },

    /**
     * Get raw store for an agent (for persistence/export).
     */
    getAgent(agentId) {
      return stores.get(agentId) || [];
    },

    categories: CATEGORIES,
  };
}

function filterFailures(entries, query) {
  let results = entries;
  if (query.category) {
    results = results.filter((f) => f.category === query.category);
  }
  if (query.categories) {
    results = results.filter((f) => query.categories.includes(f.category));
  }
  if (query.text) {
    const lower = query.text.toLowerCase();
    results = results.filter(
      (f) => f.description.toLowerCase().includes(lower) || f.lesson.toLowerCase().includes(lower),
    );
  }
  if (query.maxAge) {
    const cutoff = new Date(Date.now() - parseDuration(query.maxAge));
    results = results.filter((f) => new Date(f.date) >= cutoff);
  }
  return results;
}

function parseDuration(str) {
  const match = str.match(/^(\d+)([dhm])$/);
  if (!match) return 0;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'd') return val * 86400000;
  if (unit === 'h') return val * 3600000;
  if (unit === 'm') return val * 60000;
  return 0;
}
