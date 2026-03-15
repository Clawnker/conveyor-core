import test from 'node:test';
import assert from 'node:assert/strict';

import { runLaneRoutingExample } from './index.js';

test('starter example demonstrates lane-aware create, handoff, and claim flow', () => {
  const result = runLaneRoutingExample();

  assert.equal(result.createdCard.routing.currentLane, 'delivery');
  assert.equal(result.cardAwaitingReview.pendingHandoff.toLane, 'review');
  assert.equal(result.cardAwaitingReview.pendingHandoff.requestedByLane, 'delivery');
  assert.equal(result.handoffTargetsReviewLane, true);
  assert.equal(result.reviewerCanClaim, true);
  assert.equal(result.claimedCard.activeClaim.actorId, 'reviewer-1');
});
