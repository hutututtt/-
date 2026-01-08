import { RiskEvent } from '@events/schemas.js';
import { Mode } from '@fsm/modeFsm.js';
import { PodConfig } from '@config/riskPods.js';

export type MarketSnapshot = {
  symbol: string;
  price: number;
  timestamp: number;
  dataQuality: 'GOOD' | 'DELAYED' | 'GAPPED';
};

export type PreTradeCheckResult = {
  allowed: boolean;
  reason?: string;
};

export type OrderIntent = {
  podId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  reduceOnly: boolean;
  stopLossPrice?: number;
  clientOrderId: string;
  timestamp: number;
};

export type ApprovedOrderIntent = OrderIntent & { approved: true };

export function preTradeRiskGate(
  globalMode: Mode,
  podMode: Mode,
  snapshot: MarketSnapshot
): PreTradeCheckResult {
  if (globalMode !== 'NORMAL' || podMode !== 'NORMAL') {
    return { allowed: false, reason: 'Mode not normal' };
  }
  if (snapshot.dataQuality !== 'GOOD') {
    return { allowed: false, reason: 'Data quality degraded' };
  }
  return { allowed: true };
}

export function orderPermissionGate(
  pod: PodConfig,
  intent: OrderIntent,
  openPositions: number
): PreTradeCheckResult {
  if (!intent.reduceOnly && openPositions >= pod.riskLimits.maxOpenPositions) {
    return { allowed: false, reason: 'Max open positions reached' };
  }
  if (intent.reduceOnly) {
    return { allowed: true };
  }
  if (pod.riskLimits.requireStopLoss && !intent.stopLossPrice) {
    return { allowed: false, reason: 'Missing stop loss' };
  }
  if (!pod.riskLimits.allowScaleIn && openPositions > 0) {
    return { allowed: false, reason: 'Scale-in not allowed' };
  }
  if (intent.quantity * pod.riskLimits.leverage > pod.riskLimits.maxNotionalPerTrade) {
    return { allowed: false, reason: 'Notional exceeds limit' };
  }
  return { allowed: true };
}

export function executionAdmissionGate(intent: OrderIntent): ApprovedOrderIntent | null {
  if (intent.quantity <= 0) {
    return null;
  }
  return { ...intent, approved: true };
}

export function riskEvent(podId: string | null, level: RiskEvent['level'], reason: string): RiskEvent {
  return {
    type: 'RiskEvent',
    podId,
    level,
    reason,
    timestamp: Date.now()
  };
}
