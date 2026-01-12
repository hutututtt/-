import type { ExchangeOrder, ExchangePosition, ExchangeBalance } from '@exchange/types.js';
import type { OkxOrderData, OkxPositionData, OkxBalanceData, PlaceOrderParams } from './types.js';

/**
 * Map OKX order status to internal ExchangeOrder status
 */
export function mapOkxStatusToInternal(
  okxStatus: OkxOrderData['state']
): ExchangeOrder['status'] {
  switch (okxStatus) {
    case 'live':
      return 'NEW';
    case 'partially_filled':
      return 'PARTIAL';
    case 'filled':
      return 'FILLED';
    case 'canceled':
      return 'CANCELED';
    case 'rejected':
      return 'REJECTED';
    default:
      // Unknown status, treat as rejected
      console.warn(`Unknown OKX order status: ${okxStatus}, treating as REJECTED`);
      return 'REJECTED';
  }
}

/**
 * Map internal side to OKX side
 */
export function mapInternalSideToOkx(side: 'BUY' | 'SELL'): 'buy' | 'sell' {
  return side === 'BUY' ? 'buy' : 'sell';
}

/**
 * Map OKX side to internal side
 */
export function mapOkxSideToInternal(side: 'buy' | 'sell'): 'BUY' | 'SELL' {
  return side === 'buy' ? 'BUY' : 'SELL';
}

/**
 * Map internal ExchangeOrder to OKX PlaceOrderParams
 */
export function mapExchangeOrderToOkxParams(
  order: Omit<ExchangeOrder, 'status' | 'timestamp'>
): PlaceOrderParams {
  return {
    instId: order.symbol,
    tdMode: 'cross',  // Default to cross margin mode
    side: mapInternalSideToOkx(order.side),
    ordType: order.price > 0 ? 'limit' : 'market',
    sz: order.quantity.toString(),
    px: order.price > 0 ? order.price.toString() : undefined,
    clOrdId: order.clientOrderId,
    reduceOnly: order.reduceOnly || undefined,
    tag: order.podId  // Use podId as order tag for tracking
  };
}

/**
 * Map OKX order response to internal ExchangeOrder
 */
export function mapOkxOrderToExchangeOrder(
  okxOrder: OkxOrderData,
  podId: string
): ExchangeOrder {
  const status = mapOkxStatusToInternal(okxOrder.state);
  const filledQuantity = parseFloat(okxOrder.accFillSz || '0');
  const averagePrice = parseFloat(okxOrder.avgPx || '0');

  return {
    clientOrderId: okxOrder.clOrdId,
    podId: podId || okxOrder.tag,  // Use tag as podId if not provided
    symbol: okxOrder.instId,
    side: mapOkxSideToInternal(okxOrder.side),
    quantity: parseFloat(okxOrder.sz),
    price: parseFloat(okxOrder.px || '0'),
    status,
    reduceOnly: false,  // OKX doesn't return this in response
    timestamp: parseInt(okxOrder.cTime, 10)
  };
}

/**
 * Map OKX position to internal ExchangePosition
 */
export function mapOkxPositionToExchangePosition(
  okxPosition: OkxPositionData,
  podId: string
): ExchangePosition {
  const quantity = parseFloat(okxPosition.pos);
  const averagePrice = parseFloat(okxPosition.avgPx);

  return {
    podId,
    symbol: okxPosition.instId,
    quantity,
    averagePrice
  };
}

/**
 * Map OKX balance to internal ExchangeBalance
 * Returns total account equity in USD
 */
export function mapOkxBalanceToExchangeBalance(
  okxBalance: OkxBalanceData,
  currency: string = 'USDT'
): ExchangeBalance {
  // Use total equity in USD as the total balance
  const totalEquity = parseFloat(okxBalance.totalEq || '0');

  // Find the balance for the specified currency for available balance
  const currencyBalance = okxBalance.details.find(d => d.ccy === currency);

  // Calculate total available balance across all currencies in USD
  const totalAvailable = okxBalance.details.reduce((sum, detail) => {
    const availEq = parseFloat(detail.availEq || '0');
    const eqUsd = parseFloat(detail.eqUsd || '0');
    const availBal = parseFloat(detail.availBal || '0');
    const eq = parseFloat(detail.eq || '0');

    // Calculate available proportion and convert to USD
    if (eq > 0 && eqUsd > 0) {
      const availableUsd = (availBal / eq) * eqUsd;
      return sum + availableUsd;
    }
    return sum;
  }, 0);

  return {
    total: totalEquity,
    available: totalAvailable
  };
}

/**
 * Parse numeric string safely, returning 0 if invalid
 */
export function parseNumericString(value: string | undefined | null): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number to string with appropriate precision
 */
export function formatNumberToString(value: number, decimals: number = 8): string {
  return value.toFixed(decimals);
}
