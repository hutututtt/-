export type TradingMode = 'DRY_RUN' | 'PAPER' | 'LIVE';

export type ExchangeOrder = {
  clientOrderId: string;
  podId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'NEW' | 'PARTIAL' | 'FILLED' | 'CANCELED' | 'REJECTED';
  reduceOnly: boolean;
  timestamp: number;
};

export type ExchangePosition = {
  podId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
};

export type ExchangeBalance = {
  total: number;
  available: number;
};

export type ExchangeError = {
  message: string;
  retriable: boolean;
};

export type ExchangeBroker = {
  placeOrder(order: Omit<ExchangeOrder, 'status' | 'timestamp'>): Promise<ExchangeOrder>;
  cancelOrder(clientOrderId: string): Promise<ExchangeOrder | null>;
  fetchOrders(): Promise<ExchangeOrder[]>;
  fetchPositions(): Promise<ExchangePosition[]>;
  fetchBalance(): Promise<ExchangeBalance>;
};
