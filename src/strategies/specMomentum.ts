import { SignalEvent } from '@events/schemas.js';
import { MarketSnapshot } from '@risk/gates.js';

export function specMomentumStrategy(podId: string, snapshot: MarketSnapshot): SignalEvent {
  const action = snapshot.price % 3 === 0 ? 'BUY' : 'SELL';
  return {
    type: 'SignalEvent',
    podId,
    symbol: snapshot.symbol,
    action,
    confidence: 0.7,
    timestamp: Date.now()
  };
}
