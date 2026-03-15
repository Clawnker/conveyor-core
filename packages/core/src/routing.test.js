import test from 'node:test';
import assert from 'node:assert/strict';

import {
  defaultLaneForStage,
  normalizePendingHandoff,
  normalizeActiveClaim,
  claimMatchesRoutingTarget,
  pendingHandoffTargetsRouting,
} from './routing.js';

test('defaultLaneForStage keeps routing coarse and stage-based', () => {
  assert.equal(defaultLaneForStage('intake'), 'intake');
  assert.equal(defaultLaneForStage('scoped'), 'intake');
  assert.equal(defaultLaneForStage('in_progress'), 'delivery');
  assert.equal(defaultLaneForStage('qa'), 'review');
  assert.equal(defaultLaneForStage('unknown'), null);
});

test('normalizePendingHandoff maps legacy field names into the public packet shape', () => {
  assert.deepEqual(
    normalizePendingHandoff({
      to: 'reviewer-1',
      targetLane: 'review',
      summary: 'Unit tests and changelog attached',
      from: 'builder-1',
      fromLane: 'delivery',
      handoffAt: '2026-04-01T10:00:00.000Z',
    }),
    {
      toAgentId: 'reviewer-1',
      toLane: 'review',
      intent: null,
      evidenceSummary: 'Unit tests and changelog attached',
      requestedBy: 'builder-1',
      requestedByLane: 'delivery',
      requestedAt: '2026-04-01T10:00:00.000Z',
    }
  );
});

test('normalizeActiveClaim returns a stable actor claim shape', () => {
  assert.deepEqual(
    normalizeActiveClaim({
      claimedBy: 'audit-1',
      lane: 'review',
      startedAt: '2026-04-01T11:00:00.000Z',
    }),
    {
      actorId: 'audit-1',
      actorLane: 'review',
      claimedAt: '2026-04-01T11:00:00.000Z',
    }
  );
});

test('claimMatchesRoutingTarget supports specific agents and lane targets', () => {
  const handoff = normalizePendingHandoff({
    toAgentId: 'audit-1',
    toLane: 'review',
  });

  assert.equal(
    claimMatchesRoutingTarget({ actorId: 'audit-1', actorLane: 'review' }, handoff),
    true
  );
  assert.equal(
    claimMatchesRoutingTarget({ actorId: 'audit-1', actorLane: 'delivery' }, handoff),
    false
  );
  assert.equal(
    claimMatchesRoutingTarget({ actorId: 'other', actorLane: 'review' }, handoff),
    false
  );
});

test('pendingHandoffTargetsRouting works against cards, contexts, and wildcard lanes', () => {
  const card = {
    id: 'card-42',
    pendingHandoff: {
      toLane: 'review',
      requestedBy: 'builder-1',
    },
  };

  assert.equal(pendingHandoffTargetsRouting(card, { lane: 'review' }), true);
  assert.equal(pendingHandoffTargetsRouting({ handoff: { toLane: 'ops-risk' } }, { lane: 'ops-*' }), true);
  assert.equal(pendingHandoffTargetsRouting(card, { agentId: 'audit-1' }), false);
});
