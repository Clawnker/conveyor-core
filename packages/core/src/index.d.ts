export type Stage = 'intake' | 'scoped' | 'in_progress' | 'review' | 'qa' | 'done';

export interface FailureEntry {
  category: string;
  title: string;
  date: string;
  detail: string;
}

export interface DecisionEntry {
  date: string;
  decision: string;
  why: string;
  scope: string;
  expiry: string;
}

export interface PendingHandoff {
  toAgentId: string | null;
  toLane: string | null;
  intent: string | null;
  evidenceSummary: string | null;
  requestedBy: string | null;
  requestedByLane: string | null;
  requestedAt: string | null;
}

export interface ActiveClaim {
  actorId: string | null;
  actorLane: string | null;
  claimedAt: string | null;
}

export interface RoutingTarget {
  agentId?: string | null;
  lane?: string | null;
}

export const STAGES: Stage[];

export function nextStage(stage: string): Stage | null;
export function unresolvedBlockers(card: { blockers?: Array<{ resolvedAt?: string | null }> }): Array<{ resolvedAt?: string | null }>;

export function parseFailureLog(markdown?: string): FailureEntry[];
export function checkFailureGate(
  card: { title?: string; workType?: string },
  failures?: FailureEntry[],
  options?: { similarityThreshold?: number }
): null | { reason: string; matchedFailure: FailureEntry };
export function addFailure(failures: FailureEntry[], entry: { category?: string; title?: string; detail?: string }): FailureEntry[];
export function pruneFailures(failures: FailureEntry[]): FailureEntry[];
export function serializeFailureLog(failures?: FailureEntry[]): string;

export function parseDecisionLog(markdown?: string): DecisionEntry[];
export function logDecision(
  decisions: DecisionEntry[],
  entry: { decision?: string; why?: string; scope?: string; expiry?: string }
): DecisionEntry[];
export function serializeDecisionLog(decisions?: DecisionEntry[]): string;
export function decisionFromTransition(
  card: { id?: string; title?: string; projectKey?: string },
  fromStage: string,
  toStage: string,
  why: string,
  scope?: string
): { decision: string; why: string; scope: string; expiry: string };

export function defaultLaneForStage(stage: string): string | null;
export function normalizePendingHandoff(input?: Record<string, unknown>): PendingHandoff;
export function normalizeActiveClaim(input?: Record<string, unknown>): ActiveClaim;
export function claimMatchesRoutingTarget(actor: Record<string, unknown>, handoff: Record<string, unknown>): boolean;
export function pendingHandoffTargetsRouting(cardOrContext: Record<string, unknown>, target: RoutingTarget | string): boolean;
