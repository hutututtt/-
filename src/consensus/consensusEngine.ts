import { AiRecommendationEvent, ConsensusDecisionEvent, SignalEvent } from '@events/schemas.js';

export function consensusEngine(
  podId: string,
  signal: SignalEvent,
  aiRecommendation: AiRecommendationEvent
): ConsensusDecisionEvent {
  const voteWeight = signal.confidence * 0.6 + aiRecommendation.confidence * 0.4;
  const vetoed = aiRecommendation.suggestion === 'REJECT';
  const decision = vetoed
    ? 'REJECTED'
    : voteWeight > 0.6
      ? 'APPROVED'
      : 'ABSTAIN';
  return {
    type: 'ConsensusDecisionEvent',
    podId,
    decision,
    vetoed,
    rationale: `voteWeight=${voteWeight.toFixed(2)}`,
    timestamp: Date.now()
  };
}
