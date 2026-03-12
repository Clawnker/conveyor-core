export const STAGES = ['intake', 'scoped', 'in_progress', 'review', 'qa', 'done'];

export function nextStage(stage) {
  const ix = STAGES.indexOf(stage);
  if (ix < 0 || ix === STAGES.length - 1) return null;
  return STAGES[ix + 1];
}

export function unresolvedBlockers(card) {
  return (card.blockers || []).filter((b) => !b.resolvedAt);
}
