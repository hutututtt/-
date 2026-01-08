import { FillEvent } from '@events/schemas.js';

export type PositionState = {
  podId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastUpdate: number;
};

export class PositionFSM {
  private positions = new Map<string, PositionState>();

  private key(podId: string, symbol: string): string {
    return `${podId}:${symbol}`;
  }

  apply(fill: FillEvent): PositionState {
    const key = this.key(fill.podId, fill.symbol);
    const existing = this.positions.get(key) ?? {
      podId: fill.podId,
      symbol: fill.symbol,
      quantity: 0,
      averagePrice: 0,
      lastUpdate: fill.timestamp
    };

    const signedQty = fill.side === 'BUY' ? fill.quantity : -fill.quantity;
    const newQty = existing.quantity + signedQty;
    const newAvg =
      newQty === 0
        ? 0
        : (existing.averagePrice * existing.quantity + fill.price * signedQty) / newQty;

    const updated: PositionState = {
      ...existing,
      quantity: newQty,
      averagePrice: newAvg,
      lastUpdate: fill.timestamp
    };
    this.positions.set(key, updated);
    return updated;
  }

  getPosition(podId: string, symbol: string): PositionState | undefined {
    return this.positions.get(this.key(podId, symbol));
  }

  snapshot() {
    return { positions: Array.from(this.positions.values()) };
  }

  hydrate(state: { positions: PositionState[] }) {
    this.positions = new Map(
      state.positions.map((position) => [this.key(position.podId, position.symbol), position])
    );
  }
}
