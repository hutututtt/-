import type { ExchangeBroker, ExchangeOrder, ExchangePosition, ExchangeBalance, TradingMode } from './types.js';
import { OkxApiClient } from './okx/apiClient.js';
import { OkxAuditLogger } from './okx/auditLogger.js';
import {
  mapExchangeOrderToOkxParams,
  mapOkxOrderToExchangeOrder,
  mapOkxPositionToExchangePosition,
  mapOkxBalanceToExchangeBalance
} from './okx/typeMappers.js';
import { OkxApiError } from './okx/types.js';

export class OkxBroker implements ExchangeBroker {
  private apiClient: OkxApiClient;
  private auditLogger: OkxAuditLogger;

  constructor(tradingMode: TradingMode) {
    this.apiClient = new OkxApiClient(tradingMode);
    this.auditLogger = new OkxAuditLogger(tradingMode);
  }

  async placeOrder(order: Omit<ExchangeOrder, 'status' | 'timestamp'>): Promise<ExchangeOrder> {
    try {
      // Map internal order to OKX parameters
      const okxParams = mapExchangeOrderToOkxParams(order);

      // Place order via API client
      const response = await this.apiClient.placeOrder(okxParams);

      // Check if order was placed successfully
      if (response.data.length === 0) {
        const rejectedOrder = {
          ...order,
          status: 'REJECTED' as const,
          timestamp: Date.now()
        };
        this.auditLogger.logOrderPlacement(rejectedOrder, okxParams, response);
        return rejectedOrder;
      }

      // Map OKX response to internal format
      const okxOrder = response.data[0];
      const exchangeOrder = mapOkxOrderToExchangeOrder(okxOrder, order.podId);
      
      // Log order placement
      this.auditLogger.logOrderPlacement(exchangeOrder, okxParams, response);
      
      return exchangeOrder;
    } catch (error) {
      // Log error
      this.auditLogger.logError('placeOrder', error as Error, { order });
      
      // Handle API errors
      if (error instanceof OkxApiError) {
        return {
          ...order,
          status: 'REJECTED',
          timestamp: Date.now()
        };
      }
      throw error;
    }
  }

  async cancelOrder(clientOrderId: string): Promise<ExchangeOrder | null> {
    try {
      // We need to know the instrument ID to cancel an order
      // First, try to find the order in pending orders
      const pendingOrders = await this.fetchOrders();
      const orderToCancel = pendingOrders.find(o => o.clientOrderId === clientOrderId);

      if (!orderToCancel) {
        // Order not found, return null
        this.auditLogger.logOrderCancellation(clientOrderId, { error: 'Order not found' });
        return null;
      }

      // Cancel the order
      const response = await this.apiClient.cancelOrder({
        instId: orderToCancel.symbol,
        clOrdId: clientOrderId
      });

      if (response.data.length === 0) {
        this.auditLogger.logOrderCancellation(clientOrderId, response);
        return null;
      }

      // Map response to internal format
      const okxOrder = response.data[0];
      const canceledOrder = mapOkxOrderToExchangeOrder(okxOrder, orderToCancel.podId);
      
      // Log cancellation
      this.auditLogger.logOrderCancellation(clientOrderId, response);
      
      return canceledOrder;
    } catch (error) {
      // Log error
      this.auditLogger.logError('cancelOrder', error as Error, { clientOrderId });
      
      if (error instanceof OkxApiError) {
        // Order might not exist or already canceled
        return null;
      }
      throw error;
    }
  }

  async fetchOrders(): Promise<ExchangeOrder[]> {
    try {
      // Fetch pending orders
      const response = await this.apiClient.getPendingOrders();

      // Map all orders to internal format
      const orders = response.data.map(okxOrder => 
        mapOkxOrderToExchangeOrder(okxOrder, okxOrder.tag || 'unknown')
      );
      
      // Log query result
      this.auditLogger.logOrderQuery(orders);
      
      return orders;
    } catch (error) {
      // Log error
      this.auditLogger.logError('fetchOrders', error as Error);
      
      if (error instanceof OkxApiError) {
        console.error('Failed to fetch orders:', error.message);
        return [];
      }
      throw error;
    }
  }

  async fetchPositions(): Promise<ExchangePosition[]> {
    try {
      // Fetch all positions
      const response = await this.apiClient.getPositions();

      // Map all positions to internal format
      const positions = response.data.map(okxPosition => 
        mapOkxPositionToExchangePosition(okxPosition, okxPosition.instId)
      );
      
      // Log query result
      this.auditLogger.logPositionQuery(positions);
      
      return positions;
    } catch (error) {
      // Log error
      this.auditLogger.logError('fetchPositions', error as Error);
      
      if (error instanceof OkxApiError) {
        console.error('Failed to fetch positions:', error.message);
        return [];
      }
      throw error;
    }
  }

  async fetchBalance(): Promise<ExchangeBalance> {
    try {
      // Fetch account balance
      const response = await this.apiClient.getBalance();

      console.log('[OKX] Balance response:', JSON.stringify(response, null, 2));

      if (response.data.length === 0) {
        console.warn('[OKX] Empty balance response');
        const emptyBalance = { total: 0, available: 0 };
        this.auditLogger.logBalanceQuery(emptyBalance);
        return emptyBalance;
      }

      // Map balance to internal format (default to USDT)
      const balance = mapOkxBalanceToExchangeBalance(response.data[0], 'USDT');
      
      console.log('[OKX] Mapped balance:', balance);
      
      // Log query result
      this.auditLogger.logBalanceQuery(balance);
      
      return balance;
    } catch (error) {
      // Log error
      this.auditLogger.logError('fetchBalance', error as Error);
      
      if (error instanceof OkxApiError) {
        console.error('Failed to fetch balance:', error.message);
        return { total: 0, available: 0 };
      }
      throw error;
    }
  }
}
