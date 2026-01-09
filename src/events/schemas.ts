import { z } from 'zod';

export const MarketEventSchema = z.object({
  type: z.literal('MarketEvent'),
  symbol: z.string(),
  timestamp: z.number(),
  price: z.number(),
  volatility: z.number().optional(),
  dataQuality: z.enum(['GOOD', 'DELAYED', 'GAPPED'])
});

export const SignalEventSchema = z.object({
  type: z.literal('SignalEvent'),
  podId: z.string(),
  symbol: z.string(),
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  confidence: z.number(),
  timestamp: z.number()
});

export const AiRecommendationSchema = z.object({
  type: z.literal('AiRecommendationEvent'),
  podId: z.string(),
  suggestion: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']),
  confidence: z.number(),
  notes: z.string().optional(),
  timestamp: z.number()
});

export const ConsensusDecisionSchema = z.object({
  type: z.literal('ConsensusDecisionEvent'),
  podId: z.string(),
  decision: z.enum(['APPROVED', 'REJECTED', 'ABSTAIN']),
  vetoed: z.boolean(),
  rationale: z.string(),
  timestamp: z.number()
});

export const OrderIntentSchema = z.object({
  type: z.literal('OrderIntentEvent'),
  podId: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number(),
  reduceOnly: z.boolean(),
  stopLossPrice: z.number().optional(),
  clientOrderId: z.string(),
  timestamp: z.number()
});

export const OrderLifecycleSchema = z.object({
  type: z.literal('OrderLifecycleEvent'),
  clientOrderId: z.string(),
  status: z.enum(['ACK', 'PARTIAL', 'FILLED', 'CANCELED', 'REJECTED']),
  filledQuantity: z.number().default(0),
  timestamp: z.number(),
  podId: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL'])
});

export const FillEventSchema = z.object({
  type: z.literal('FillEvent'),
  clientOrderId: z.string(),
  podId: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number(),
  price: z.number(),
  timestamp: z.number()
});

export const PositionEventSchema = z.object({
  type: z.literal('PositionEvent'),
  podId: z.string(),
  symbol: z.string(),
  quantity: z.number(),
  averagePrice: z.number(),
  timestamp: z.number()
});

export const RiskEventSchema = z.object({
  type: z.literal('RiskEvent'),
  podId: z.string().nullable(),
  level: z.enum(['INFO', 'WARN', 'CRITICAL']),
  reason: z.string(),
  timestamp: z.number()
});

export const TradeEventSchema = z.object({
  type: z.literal('TradeEvent'),
  podId: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number(),
  price: z.number(),
  pnl: z.number().optional(),
  timestamp: z.number()
});

export type MarketEvent = z.infer<typeof MarketEventSchema>;
export type SignalEvent = z.infer<typeof SignalEventSchema>;
export type AiRecommendationEvent = z.infer<typeof AiRecommendationSchema>;
export type ConsensusDecisionEvent = z.infer<typeof ConsensusDecisionSchema>;
export type OrderIntentEvent = z.infer<typeof OrderIntentSchema>;
export type OrderLifecycleEvent = z.infer<typeof OrderLifecycleSchema>;
export type FillEvent = z.infer<typeof FillEventSchema>;
export type PositionEvent = z.infer<typeof PositionEventSchema>;
export type RiskEvent = z.infer<typeof RiskEventSchema>;
export type TradeEvent = z.infer<typeof TradeEventSchema>;
