import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDecisionLog, serializeDecisionLog, logDecision, decisionFromTransition } from './decision-log.js';

test('parseDecisionLog skips only the table header and separator', () => {
  const markdown = [
    '| Date | Decision | Why | Scope | Expiry |',
    '|------|----------|-----|-------|--------|',
    '| 2026-03-14 | Date migration | Why contains Date too | demo | |',
  ].join('\n');

  const decisions = parseDecisionLog(markdown);

  assert.equal(decisions.length, 1);
  assert.deepEqual(decisions[0], {
    date: '2026-03-14',
    decision: 'Date migration',
    why: 'Why contains Date too',
    scope: 'demo',
    expiry: '',
  });
});

test('decision log entries round-trip through serialize/parse', () => {
  const decisions = [];

  logDecision(
    decisions,
    decisionFromTransition({ id: 'card-42', title: 'Stabilize parser', projectKey: 'demo' }, 'scoped', 'review', 'Tests passing')
  );

  const parsed = parseDecisionLog(serializeDecisionLog(decisions));

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].decision, 'Stabilize parser: scoped → review');
  assert.equal(parsed[0].why, 'Tests passing');
  assert.equal(parsed[0].scope, 'demo');
});
