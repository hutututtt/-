import { ExchangeBroker, ExchangeOrder, ExchangePosition } from './types.js';

export class MockExchange implements ExchangeBroker {
  private orders = new Map<string, ExchangeOrder>();
  private positions = new Map<string, ExchangePosition>();
  private balance = { total: 10000, available: 10000 };

  async placeOrder(order: Omit<ExchangeOrder, 'status' | 'timestamp'>): Promise<ExchangeOrder> {
    const filled = Math.random() > 0.2;
    const status: ExchangeOrder['status'] = filled ? 'FILLED' : 'PARTIAL';
    const created: ExchangeOrder = {
      ...order,
      status,
      timestamp: Date.now()
    };
    this.orders.set(order.clientOrderId, created);
    if (filled) {
      this.applyFill(created);
    }
    return created;
  }

  async cancelOrder(clientOrderId: string): Promise<ExchangeOrder | null> {
    const order = this.orders.get(clientOrderId);
    if (!order) {
      return null;
    }
    const canceled: ExchangeOrder = { ...order, status: 'CANCELED', timestamp: Date.now() };
    this.orders.set(clientOrderId, canceled);
    return canceled;
  }

  async fetchOrders(): Promise<ExchangeOrder[]> {
    return Array.from(this.orders.values());
  }

  async fetchPositions(): Promise<ExchangePosition[]> {
    return Array.from(this.positions.values());
  }

  async fetchBalance() {
    return this.balance;
  }

  private applyFill(order: ExchangeOrder) {
    const key = `${order.podId}:${order.symbol}`;
    const existing = this.positions.get(key) ?? {
      podId: order.podId,
      symbol: order.symbol,
      quantity: 0,
      averagePrice: 0
    };
    const signedQty = order.side === 'BUY' ? order.quantity : -order.quantity;
    const newQty = existing.quantity + signedQty;
    const newAvg =
      newQty === 0
        ? 0
        : (existing.averagePrice * existing.quantity + order.price * signedQty) / newQty;
    this.positions.set(key, {
      podId: order.podId,
      symbol: order.symbol,
      quantity: newQty,
      averagePrice: newAvg
    });
  }
}
