import { fileURLToPath } from 'node:url';

import {
  defaultLaneForStage,
  normalizePendingHandoff,
  normalizeActiveClaim,
  claimMatchesRoutingTarget,
  pendingHandoffTargetsRouting,
} from '../../../packages/core/src/index.js';

export function runLaneRoutingExample() {
  const createdCard = {
    id: 'demo-1',
    title: 'Stabilize flaky checkout path',
    stage: 'in_progress',
    routing: {
      currentLane: defaultLaneForStage('in_progress'),
    },
  };

  const pendingHandoff = normalizePendingHandoff({
    toLane: defaultLaneForStage('review'),
    intent: 'request-review',
    evidenceSummary: 'Fix applied, tests linked, rollback noted',
    requestedBy: 'builder-1',
    requestedByLane: createdCard.routing.currentLane,
    requestedAt: '2026-04-01T12:00:00.000Z',
  });

  const cardAwaitingReview = {
    ...createdCard,
    stage: 'review',
    pendingHandoff,
  };

  const reviewerClaim = normalizeActiveClaim({
    actorId: 'reviewer-1',
    actorLane: 'review',
    claimedAt: '2026-04-01T12:05:00.000Z',
  });

  const reviewerCanClaim = claimMatchesRoutingTarget(reviewerClaim, pendingHandoff);

  return {
    createdCard,
    cardAwaitingReview,
    reviewerClaim,
    reviewerCanClaim,
    handoffTargetsReviewLane: pendingHandoffTargetsRouting(cardAwaitingReview, { lane: 'review' }),
    claimedCard: reviewerCanClaim
      ? {
          ...cardAwaitingReview,
          activeClaim: reviewerClaim,
        }
      : cardAwaitingReview,
  };
}

function printExample(result) {
  console.log('conveyor starter boot');
  console.log('created lane:', result.createdCard.routing.currentLane);
  console.log('handoff lane:', result.cardAwaitingReview.pendingHandoff.toLane);
  console.log('review lane targeted:', result.handoffTargetsReviewLane);
  console.log('reviewer can claim:', result.reviewerCanClaim);
  console.log('active claim lane:', result.claimedCard.activeClaim?.actorLane || 'none');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  printExample(runLaneRoutingExample());
}
