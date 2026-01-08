import { OrderLifecycleEvent } from '@events/schemas.js';

export type OrderState = {
  clientOrderId: string;
  status: OrderLifecycleEvent['status'];
  filledQuantity: number;
  podId: string;
  symbol: string;
  side: OrderLifecycleEvent['side'];
  lastUpdate: number;
};

const FINAL_STATES: OrderLifecycleEvent['status'][] = ['FILLED', 'CANCELED', 'REJECTED'];

export class OrderFSM {
  private orders = new Map<string, OrderState>();
  private dedupe = new Set<string>();

  apply(event: OrderLifecycleEvent): OrderState {
    const existing = this.orders.get(event.clientOrderId);
    if (existing && FINAL_STATES.includes(existing.status)) {
      return existing;
    }
    const updated: OrderState = {
      clientOrderId: event.clientOrderId,
      status: event.status,
      filledQuantity: event.filledQuantity,
      podId: event.podId,
      symbol: event.symbol,
      side: event.side,
      lastUpdate: event.timestamp
    };
    this.orders.set(event.clientOrderId, updated);
    this.dedupe.add(event.clientOrderId);
    return updated;
  }

  isDuplicate(clientOrderId: string): boolean {
    return this.dedupe.has(clientOrderId);
  }

  snapshot() {
    return {
      orders: Array.from(this.orders.values()),
      dedupe: Array.from(this.dedupe.values())
    };
  }

  hydrate(state: { orders: OrderState[]; dedupe: string[] }) {
    this.orders = new Map(state.orders.map((order) => [order.clientOrderId, order]));
    this.dedupe = new Set(state.dedupe);
  }
}
