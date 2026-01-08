import { SignalEvent } from '@events/schemas.js';
import { MarketSnapshot } from '@risk/gates.js';

export function coreTrendStrategy(podId: string, snapshot: MarketSnapshot): SignalEvent {
  const action = snapshot.price % 2 === 0 ? 'BUY' : 'SELL';
  return {
    type: 'SignalEvent',
    podId,
    symbol: snapshot.symbol,
    action,
    confidence: 0.55,
    timestamp: Date.now()
  };
}
