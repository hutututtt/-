import { ExchangeBroker, ExchangeOrder, ExchangePosition, ExchangeBalance } from './types.js';

export class OkxBroker implements ExchangeBroker {
  async placeOrder(order: Omit<ExchangeOrder, 'status' | 'timestamp'>): Promise<ExchangeOrder> {
    return {
      ...order,
      status: 'REJECTED',
      timestamp: Date.now()
    };
  }

  async cancelOrder(clientOrderId: string): Promise<ExchangeOrder | null> {
    return {
      clientOrderId,
      podId: 'unknown',
      symbol: 'UNKNOWN',
      side: 'BUY',
      quantity: 0,
      price: 0,
      status: 'CANCELED',
      reduceOnly: true,
      timestamp: Date.now()
    };
  }

  async fetchOrders(): Promise<ExchangeOrder[]> {
    return [];
  }

  async fetchPositions(): Promise<ExchangePosition[]> {
    return [];
  }

  async fetchBalance(): Promise<ExchangeBalance> {
    return { total: 0, available: 0 };
  }
}
