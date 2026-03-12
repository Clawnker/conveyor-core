/**
 * decision-log.js — Structured decision tracking for conveyor stage transitions.
 *
 * Auto-logs WHY a task changed stage, who moved it, and when.
 * Searchable, auditable, compact.
 *
 * Decision log format (markdown table):
 *   | Date | Decision | Why | Scope | Expiry |
 *
 * Usage:
 *   import { logDecision, parseDecisionLog, serializeDecisionLog } from './decision-log.js';
 *
 *   const decisions = parseDecisionLog(existingMarkdown);
 *   logDecision(decisions, {
 *     decision: 'Moved card-42 to review',
 *     why: 'All tests passing, evidence attached',
 *     scope: 'gridpilot',
 *     expiry: '2026-04-01'
 *   });
 *   const md = serializeDecisionLog(decisions);
 */

const MAX_DECISIONS = 50;

/**
 * Parse a markdown decision log into structured entries.
 * Expects a markdown table with | Date | Decision | Why | Scope | Expiry |
 * @param {string} markdown
 * @returns {Array<{date: string, decision: string, why: string, scope: string, expiry: string}>}
 */
export function parseDecisionLog(markdown = '') {
  const entries = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Skip header and separator rows
    if (!line.startsWith('|') || line.includes('---') || line.includes('Date')) continue;

    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 4) {
      entries.push({
        date: cells[0],
        decision: cells[1],
        why: cells[2],
        scope: cells[3],
        expiry: cells[4] || '',
      });
    }
  }
  return entries;
}

/**
 * Add a decision entry. Auto-prunes oldest if over MAX_DECISIONS.
 * @param {Array} decisions - Mutable array of decision entries
 * @param {object} entry - { decision, why, scope, expiry? }
 * @returns {Array}
 */
export function logDecision(decisions, entry) {
  const now = new Date().toISOString().slice(0, 10);
  decisions.push({
    date: now,
    decision: entry.decision || '',
    why: entry.why || '',
    scope: entry.scope || 'global',
    expiry: entry.expiry || '',
  });

  // Prune oldest
  while (decisions.length > MAX_DECISIONS) {
    decisions.shift();
  }
  return decisions;
}

/**
 * Serialize decisions back to markdown table format.
 * @param {Array} decisions
 * @returns {string}
 */
export function serializeDecisionLog(decisions = []) {
  const lines = [
    '# Decision Log',
    `<!-- Max ${MAX_DECISIONS} entries. Oldest pruned automatically. -->`,
    '',
    '| Date | Decision | Why | Scope | Expiry |',
    '|------|----------|-----|-------|--------|',
  ];

  for (const d of decisions) {
    lines.push(`| ${d.date} | ${d.decision} | ${d.why} | ${d.scope} | ${d.expiry} |`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Create a decision entry from a conveyor stage transition.
 * Convenience wrapper for auto-logging stage moves.
 * @param {object} card - Conveyor card { id, title, stage }
 * @param {string} fromStage
 * @param {string} toStage
 * @param {string} why - Reason for the transition
 * @param {string} [scope] - Project/agent scope
 * @returns {object} Decision entry ready for logDecision()
 */
export function decisionFromTransition(card, fromStage, toStage, why, scope) {
  return {
    decision: `${card.title || card.id}: ${fromStage} → ${toStage}`,
    why: why || 'No reason given',
    scope: scope || card.projectKey || 'global',
    expiry: '',
  };
}
