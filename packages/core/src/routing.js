const DEFAULT_LANES_BY_STAGE = Object.freeze({
  intake: 'intake',
  scoped: 'intake',
  in_progress: 'delivery',
  review: 'review',
  qa: 'review',
  done: 'done',
});

export function defaultLaneForStage(stage) {
  return DEFAULT_LANES_BY_STAGE[stage] || null;
}

export function normalizePendingHandoff(input = {}) {
  const source = normalizeObjectLike(input);

  return {
    toAgentId: cleanString(source.toAgentId ?? source.toAgent ?? source.to ?? null),
    toLane: cleanString(source.toLane ?? source.targetLane ?? source.lane ?? null),
    intent: cleanString(source.intent ?? null),
    evidenceSummary: cleanString(source.evidenceSummary ?? source.summary ?? source.evidence?.summary ?? null),
    requestedBy: cleanString(source.requestedBy ?? source.fromAgentId ?? source.from ?? null),
    requestedByLane: cleanString(source.requestedByLane ?? source.fromLane ?? null),
    requestedAt: cleanString(source.requestedAt ?? source.handoffAt ?? null),
  };
}

export function normalizeActiveClaim(input = {}) {
  const source = normalizeObjectLike(input);

  return {
    actorId: cleanString(source.actorId ?? source.agentId ?? source.claimedBy ?? source.id ?? source.actor?.id ?? null),
    actorLane: cleanString(
      source.actorLane
      ?? source.claimLane
      ?? source.lane
      ?? source.actor?.lane
      ?? firstLane(source.actor?.lanes)
      ?? null
    ),
    claimedAt: cleanString(source.claimedAt ?? source.activeAt ?? source.startedAt ?? null),
  };
}

export function claimMatchesRoutingTarget(actor, handoff) {
  const claim = normalizeActiveClaim(actor);
  const target = normalizePendingHandoff(handoff);
  const actorLanes = collectActorLanes(actor, claim);
  const hasTarget = Boolean(target.toAgentId || target.toLane);

  if (!hasTarget) return false;

  const matchesAgent = !target.toAgentId || claim.actorId === target.toAgentId;
  const matchesLane = !target.toLane || actorLanes.some((lane) => laneMatches(lane, target.toLane));

  return matchesAgent && matchesLane;
}

export function pendingHandoffTargetsRouting(cardOrContext, target) {
  const handoff = normalizePendingHandoff(extractPendingHandoff(cardOrContext));
  const normalizedTarget = normalizeRoutingTarget(target);
  const hasHandoffTarget = Boolean(handoff.toAgentId || handoff.toLane);
  const hasTarget = Boolean(normalizedTarget.agentId || normalizedTarget.lane);

  if (!hasHandoffTarget || !hasTarget) return false;

  const matchesAgent = !normalizedTarget.agentId || handoff.toAgentId === normalizedTarget.agentId;
  const matchesLane = !normalizedTarget.lane || laneMatches(handoff.toLane, normalizedTarget.lane);

  return matchesAgent && matchesLane;
}

function normalizeObjectLike(value) {
  if (!value || typeof value !== 'object') return {};
  return value;
}

function normalizeRoutingTarget(target = {}) {
  if (typeof target === 'string') {
    return { agentId: target, lane: null };
  }

  const source = normalizeObjectLike(target);
  return {
    agentId: cleanString(source.agentId ?? source.toAgentId ?? source.id ?? null),
    lane: cleanString(source.lane ?? source.toLane ?? source.targetLane ?? null),
  };
}

function extractPendingHandoff(cardOrContext) {
  const source = normalizeObjectLike(cardOrContext);

  if (source.pendingHandoff) return source.pendingHandoff;
  if (source.handoff) return source.handoff;

  return source;
}

function collectActorLanes(actor, claim) {
  const source = normalizeObjectLike(actor);
  const lanes = [];

  pushLane(lanes, claim.actorLane);

  if (Array.isArray(source.lanes)) {
    for (const lane of source.lanes) pushLane(lanes, lane);
  }

  if (Array.isArray(source.lane)) {
    for (const lane of source.lane) pushLane(lanes, lane);
  } else {
    pushLane(lanes, source.lane);
  }

  return lanes;
}

function pushLane(target, value) {
  const lane = cleanString(value);
  if (lane && !target.includes(lane)) target.push(lane);
}

function firstLane(value) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function laneMatches(candidate, target) {
  if (!candidate || !target) return false;
  if (candidate === '*' || target === '*') return true;
  if (candidate === target) return true;
  if (candidate.includes('*')) return target.startsWith(candidate.replace('*', ''));
  if (target.includes('*')) return candidate.startsWith(target.replace('*', ''));
  return false;
}
