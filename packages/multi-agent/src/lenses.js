/**
 * Lenses — domain-expert quality optimisation applied at review.
 *
 * A lens is NOT a structural gate ("does a PR exist?"). It's NOT a
 * checklist validator. A lens applies domain-expert thinking to an
 * agent's output and asks: "how can this be better?"
 *
 * Every task has a different subject matter. The lens asks:
 * "Who is the highest authority in the world for THIS specific task,
 * and what would THEY say?"
 *
 * Not a generic reviewer. The #1 person on earth for that exact thing.
 *
 * Examples:
 * - Blog post about local SEO → lens authority: "the head of SEO at
 *   the #1 ranked digital agency in the world"
 * - Email campaign for lead gen → lens authority: "the CMO who built
 *   HubSpot's inbound machine"
 * - Trading signal → lens authority: "Renaissance Technologies'
 *   chief risk officer"
 * - Dashboard UX → lens authority: "the lead designer at Linear"
 *
 * The lens runs at the end of each task. The output is what the
 * authority would change, add, or flag. Not pass/fail.
 *
 * Agents define their own lens authorities per task (they know their
 * domain). The orchestrator/audit agent can also apply lenses during review.
 */

export function createLensRunner() {
  const lenses = new Map();

  return {
    /**
     * Register a lens for a specific agent or domain.
     *
     * @param {Object} lens
     * @param {string} lens.domain - the domain this lens covers (e.g. 'seo', 'email', 'trading')
     * @param {string} lens.name - human-readable lens name
     * @param {string} lens.authority - the highest authority for this domain
     *   e.g. "the head of SEO at the #1 ranked digital agency in the world"
     * @param {string[]} lens.perspectives - questions this authority would ask
     *   e.g. ["What would they change about this page structure?",
     *         "What's missing that they would never ship without?"]
     * @param {string} [lens.appliesTo] - agent id this lens applies to (null = any)
     */
    register(lens) {
      if (!lens.domain || !lens.name || !lens.authority) {
        throw new Error('Lens requires domain, name, and authority');
      }
      const key = lens.appliesTo ? `${lens.appliesTo}:${lens.domain}` : `*:${lens.domain}`;
      if (!lenses.has(key)) lenses.set(key, []);
      lenses.get(key).push({
        name: lens.name,
        domain: lens.domain,
        authority: lens.authority,
        perspectives: lens.perspectives || [],
        appliesTo: lens.appliesTo || null,
      });
    },

    /**
     * Get all lenses that apply to an agent's domain.
     * Falls back to wildcard lenses if no agent-specific ones exist.
     */
    getLenses(agentId, domain) {
      const specific = lenses.get(`${agentId}:${domain}`) || [];
      const wildcard = lenses.get(`*:${domain}`) || [];
      return specific.length > 0 ? specific : wildcard;
    },

    /**
     * Apply lenses to an agent's output.
     * Returns optimisation suggestions, not pass/fail.
     *
     * @param {string} agentId - the agent whose work is being reviewed
     * @param {string} domain - the domain context (seo, email, trading, etc.)
     * @param {Object} output - the agent's work product
     * @param {Function} reviewer - async (authority, perspectives, output) => { outputReview[], processOptimisation[], priority[] }
     *   The reviewer sends authority + perspectives + output to the model.
     *   Returns two types of suggestions, both scoped to THIS task/script only:
     *   - outputReview: what to change about THIS deliverable
     *   - processOptimisation: how to improve the way THIS specific task/script runs (not the whole system)
     * @returns {{ outputReview[], processOptimisation[], priority[], lensesApplied[] }}
     */
    async apply(agentId, domain, output, reviewer) {
      const applicable = this.getLenses(agentId, domain);
      if (applicable.length === 0) {
        return { suggestions: [], priority: [], lensesApplied: [] };
      }

      const lensesApplied = [];
      const allOutputReview = [];
      const allProcessOptimisation = [];
      const allPriority = [];

      for (const lens of applicable) {
        lensesApplied.push(lens.name);
        const result = await reviewer(lens.authority, lens.perspectives, output);
        allOutputReview.push(...(result.outputReview || []));
        allProcessOptimisation.push(...(result.processOptimisation || []));
        allPriority.push(...(result.priority || []));
      }

      return {
        outputReview: allOutputReview,
        processOptimisation: allProcessOptimisation,
        priority: allPriority,
        lensesApplied,
      };
    },
  };
}
