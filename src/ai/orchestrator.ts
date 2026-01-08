import { z } from 'zod';
import { AiConfig } from '@config/types.js';
import { AiRecommendationEvent, AiRecommendationSchema } from '@events/schemas.js';

const AiSuggestionSchema = z.object({
  suggestion: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']),
  confidence: z.number(),
  notes: z.string().optional()
});

export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

export function runAiOrchestrator(podId: string, profile: AiConfig): AiRecommendationEvent {
  const suggestion: AiSuggestion = {
    suggestion: Math.random() > 0.6 ? 'APPROVE' : Math.random() > 0.5 ? 'REJECT' : 'ABSTAIN',
    confidence: Number((profile.regimeWeight + profile.riskWeight).toFixed(2)),
    notes: 'stubbed-ai'
  };
  const payload = {
    type: 'AiRecommendationEvent',
    podId,
    suggestion: suggestion.suggestion,
    confidence: suggestion.confidence,
    notes: suggestion.notes,
    timestamp: Date.now()
  };
  return AiRecommendationSchema.parse(payload);
}
