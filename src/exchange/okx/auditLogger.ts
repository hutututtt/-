import type { TradingMode } from '@exchange/types.js';
import type { ExchangeOrder, ExchangeBalance, ExchangePosition } from '@exchange/types.js';
import { appendEvent } from '@utils/eventStore.js';

export class OkxAuditLogger {
  constructor(private tradingMode: TradingMode) {}

  /**
   * Log order placement
   */
  logOrderPlacement(order: ExchangeOrder, request: unknown, response: unknown): void {
    appendEvent({
      type: 'OkxOrderPlacement',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      order: {
        clientOrderId: order.clientOrderId,
        podId: order.podId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        reduceOnly: order.reduceOnly
      },
      request,
      response
    });
  }

  /**
   * Log order cancellation
   */
  logOrderCancellation(clientOrderId: string, response: unknown): void {
    appendEvent({
      type: 'OkxOrderCancellation',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      clientOrderId,
      response
    });
  }

  /**
   * Log API call with timing information
   */
  logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    requestParams?: unknown
  ): void {
    appendEvent({
      type: 'OkxApiCall',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      endpoint,
      method,
      statusCode,
      duration,
      requestParams
    });
  }

  /**
   * Log error with details
   */
  logError(operation: string, error: Error, context?: unknown): void {
    appendEvent({
      type: 'OkxError',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: 'code' in error ? (error as any).code : undefined
      },
      context
    });
  }

  /**
   * Log retry attempt
   */
  logRetry(operation: string, attempt: number, delay: number): void {
    appendEvent({
      type: 'OkxRetry',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      operation,
      attempt,
      delay
    });
  }

  /**
   * Log balance query result
   */
  logBalanceQuery(balance: ExchangeBalance): void {
    appendEvent({
      type: 'OkxBalanceQuery',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      balance: {
        total: balance.total,
        available: balance.available
      }
    });
  }

  /**
   * Log position query result
   */
  logPositionQuery(positions: ExchangePosition[]): void {
    appendEvent({
      type: 'OkxPositionQuery',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      positions: positions.map(p => ({
        podId: p.podId,
        symbol: p.symbol,
        quantity: p.quantity,
        averagePrice: p.averagePrice
      }))
    });
  }

  /**
   * Log order query result
   */
  logOrderQuery(orders: ExchangeOrder[]): void {
    appendEvent({
      type: 'OkxOrderQuery',
      tradingMode: this.tradingMode,
      timestamp: Date.now(),
      orderCount: orders.length,
      orders: orders.map(o => ({
        clientOrderId: o.clientOrderId,
        symbol: o.symbol,
        status: o.status
      }))
    });
  }
}
