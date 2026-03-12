/**
 * failure-gate.js — Block stage progression if a similar failure already exists.
 *
 * Prevents agents from repeating known mistakes by checking a categorised
 * failure log before allowing forward transitions.
 *
 * Failure log format (markdown):
 *   ## [CATEGORY] Short description
 *   YYYY-MM-DD | What happened. What fixed it.
 *
 * Usage:
 *   import { checkFailureGate, addFailure, pruneFailures } from './failure-gate.js';
 *
 *   // Before moving a card forward:
 *   const block = checkFailureGate(card, failures);
 *   if (block) throw new Error(block.reason);
 *
 *   // After a failure:
 *   addFailure(failures, { category: 'ENGINE', title: 'Negative prices', detail: '...' });
 */

const MAX_FAILURES = 30;

/**
 * Parse a markdown failure log into structured entries.
 * @param {string} markdown - Raw markdown failure log content
 * @returns {Array<{category: string, title: string, date: string, detail: string}>}
 */
export function parseFailureLog(markdown = '') {
  const entries = [];
  const lines = markdown.split('\n');
  let current = null;

  for (const line of lines) {
    const headerMatch = line.match(/^## \[(\w+)]\s+(.+)$/);
    if (headerMatch) {
      current = { category: headerMatch[1], title: headerMatch[2], date: '', detail: '' };
      entries.push(current);
      continue;
    }
    const detailMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/);
    if (detailMatch && current) {
      current.date = detailMatch[1];
      current.detail = detailMatch[2];
    }
  }
  return entries;
}

/**
 * Check if a card's task description matches any known failure.
 * Returns a block reason if a match is found, null otherwise.
 *
 * @param {object} card - Conveyor card with at least { title, workType }
 * @param {Array} failures - Parsed failure entries
 * @param {object} [options]
 * @param {number} [options.similarityThreshold=0.3] - Word overlap threshold (0-1)
 * @returns {null|{reason: string, matchedFailure: object}}
 */
export function checkFailureGate(card, failures = [], options = {}) {
  const threshold = options.similarityThreshold ?? 0.3;
  const cardWords = tokenize(card.title || '');

  for (const failure of failures) {
    const failWords = tokenize(`${failure.title} ${failure.detail}`);
    const overlap = wordOverlap(cardWords, failWords);

    if (overlap >= threshold) {
      return {
        reason: `[FAILURE GATE] Similar failure exists: [${failure.category}] ${failure.title} (${failure.date}). Review before proceeding: ${failure.detail}`,
        matchedFailure: failure,
      };
    }
  }
  return null;
}

/**
 * Add a failure entry. Auto-prunes oldest if over MAX_FAILURES.
 * @param {Array} failures - Mutable array of failure entries
 * @param {object} entry - { category, title, detail }
 * @returns {Array} The updated failures array
 */
export function addFailure(failures, entry) {
  const now = new Date().toISOString().slice(0, 10);
  failures.push({
    category: (entry.category || 'GENERAL').toUpperCase(),
    title: entry.title || 'Unknown failure',
    date: now,
    detail: entry.detail || '',
  });
  return pruneFailures(failures);
}

/**
 * Prune failures to MAX_FAILURES, removing oldest first.
 * @param {Array} failures
 * @returns {Array}
 */
export function pruneFailures(failures) {
  while (failures.length > MAX_FAILURES) {
    failures.shift();
  }
  return failures;
}

/**
 * Serialize failures back to markdown format.
 * @param {Array} failures
 * @returns {string}
 */
export function serializeFailureLog(failures = []) {
  const lines = ['# Failure Log', `<!-- Max ${MAX_FAILURES} entries. Oldest pruned automatically. -->`, ''];
  for (const f of failures) {
    lines.push(`## [${f.category}] ${f.title}`);
    lines.push(`${f.date} | ${f.detail}`);
    lines.push('');
  }
  return lines.join('\n');
}

// --- Internal helpers ---

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function wordOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let matches = 0;
  for (const word of setA) {
    if (setB.has(word)) matches++;
  }
  return matches / Math.max(setA.size, setB.size);
}
