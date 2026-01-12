import type { TradingMode } from '@exchange/types.js';
import { OkxCredentialManager } from './credentialManager.js';
import { OkxApiError } from './types.js';
import type {
  OkxApiConfig,
  PlaceOrderParams,
  CancelOrderParams,
  GetOrderParams,
  GetOrdersParams,
  GetBalanceParams,
  GetPositionsParams,
  GetTickerParams,
  GetTickersParams,
  OkxOrderResponse,
  OkxCancelResponse,
  OkxOrdersResponse,
  OkxBalanceResponse,
  OkxPositionsResponse,
  OkxTickerResponse,
  OkxTickersResponse,
  OkxApiResponse
} from './types.js';

const OKX_BASE_URL = 'https://www.okx.com';

export class OkxApiClient {
  private baseUrl: string;
  private timeout: number;
  private credentialManager: OkxCredentialManager;

  constructor(
    private tradingMode: TradingMode,
    config?: Partial<OkxApiConfig>
  ) {
    this.baseUrl = config?.baseUrl || OKX_BASE_URL;
    this.timeout = config?.timeout || 30000;
    this.credentialManager = new OkxCredentialManager(tradingMode);
  }

  /**
   * Make an HTTP request to OKX API
   */
  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    // DRY_RUN mode should not make actual API calls
    if (this.tradingMode === 'DRY_RUN') {
      throw new Error('DRY_RUN mode does not support actual API calls');
    }

    const timestamp = new Date().toISOString();
    const body = method === 'GET' ? '' : JSON.stringify(params || {});

    // Build query string for GET requests
    let fullPath = path;
    if (method === 'GET' && params) {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      if (queryString) {
        fullPath = `${path}?${queryString}`;
      }
    }

    // Generate signature
    const signature = this.credentialManager.signRequest(
      timestamp,
      method,
      fullPath,
      body
    );

    // Construct headers
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': this.credentialManager.getApiKey(),
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.credentialManager.getApiPassphrase(),
      'Content-Type': 'application/json',
      'User-Agent': 'OKX-Multi-Pod-Trader/1.0'
    };

    // Add simulated trading header for PAPER mode
    if (this.tradingMode === 'PAPER') {
      headers['x-simulated-trading'] = '1';
    }

    // Make the request
    const url = `${this.baseUrl}${fullPath}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json() as OkxApiResponse<T>;

      // Check if the response indicates success
      if (responseData.code === '0') {
        return responseData.data;
      }

      // Handle error response
      throw this.createError(responseData.code, responseData.msg);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('TIMEOUT', 'Request timeout', true);
        }
        if (error.message.includes('fetch')) {
          throw this.createError('NETWORK', `Network error: ${error.message}`, true);
        }
      }

      throw error;
    }
  }

  /**
   * Create an OkxApiError with appropriate retriable flag
   */
  private createError(code: string, message: string, retriable: boolean = false): OkxApiError {
    return new OkxApiError(code, message, retriable);
  }

  // Trading endpoints

  /**
   * Place an order
   * POST /api/v5/trade/order
   */
  async placeOrder(params: PlaceOrderParams): Promise<OkxOrderResponse> {
    const data = await this.request<OkxOrderResponse['data'][0]>(
      'POST',
      '/api/v5/trade/order',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Cancel an order
   * POST /api/v5/trade/cancel-order
   */
  async cancelOrder(params: CancelOrderParams): Promise<OkxCancelResponse> {
    const data = await this.request<OkxCancelResponse['data'][0]>(
      'POST',
      '/api/v5/trade/cancel-order',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Get order details
   * GET /api/v5/trade/order
   */
  async getOrder(params: GetOrderParams): Promise<OkxOrderResponse> {
    const data = await this.request<OkxOrderResponse['data'][0]>(
      'GET',
      '/api/v5/trade/order',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Get pending orders
   * GET /api/v5/trade/orders-pending
   */
  async getPendingOrders(params?: GetOrdersParams): Promise<OkxOrdersResponse> {
    const data = await this.request<OkxOrdersResponse['data'][0]>(
      'GET',
      '/api/v5/trade/orders-pending',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Get order history
   * GET /api/v5/trade/orders-history-archive
   */
  async getOrderHistory(params?: GetOrdersParams): Promise<OkxOrdersResponse> {
    const data = await this.request<OkxOrdersResponse['data'][0]>(
      'GET',
      '/api/v5/trade/orders-history-archive',
      params
    );
    return { code: '0', msg: '', data };
  }

  // Account endpoints

  /**
   * Get account balance
   * GET /api/v5/account/balance
   */
  async getBalance(params?: GetBalanceParams): Promise<OkxBalanceResponse> {
    const data = await this.request<OkxBalanceResponse['data'][0]>(
      'GET',
      '/api/v5/account/balance',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Get positions
   * GET /api/v5/account/positions
   */
  async getPositions(params?: GetPositionsParams): Promise<OkxPositionsResponse> {
    const data = await this.request<OkxPositionsResponse['data'][0]>(
      'GET',
      '/api/v5/account/positions',
      params
    );
    return { code: '0', msg: '', data };
  }

  // Market data endpoints

  /**
   * Get ticker for a single instrument
   * GET /api/v5/market/ticker
   */
  async getTicker(params: GetTickerParams): Promise<OkxTickerResponse> {
    const data = await this.request<OkxTickerResponse['data'][0]>(
      'GET',
      '/api/v5/market/ticker',
      params
    );
    return { code: '0', msg: '', data };
  }

  /**
   * Get tickers for multiple instruments
   * GET /api/v5/market/tickers
   */
  async getTickers(params: GetTickersParams): Promise<OkxTickersResponse> {
    const data = await this.request<OkxTickersResponse['data'][0]>(
      'GET',
      '/api/v5/market/tickers',
      params
    );
    return { code: '0', msg: '', data };
  }
}
