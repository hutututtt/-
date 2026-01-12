// OKX API Configuration Types
export type OkxApiConfig = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  timeout: number;
  maxRetries: number;
};

// OKX API Request Parameter Types
export type PlaceOrderParams = {
  instId: string;        // Instrument ID, e.g., "BTC-USDT-SWAP"
  tdMode: string;        // Trade mode: "cross" or "isolated"
  side: 'buy' | 'sell';
  ordType: 'market' | 'limit' | 'post_only' | 'fok' | 'ioc';
  sz: string;            // Quantity as string
  px?: string;           // Price for limit orders
  clOrdId?: string;      // Client order ID
  reduceOnly?: boolean;
  tag?: string;          // Order tag for identification
};

export type CancelOrderParams = {
  instId: string;
  ordId?: string;        // Exchange order ID
  clOrdId?: string;      // Client order ID (one of ordId or clOrdId required)
};

export type GetOrderParams = {
  instId: string;
  ordId?: string;
  clOrdId?: string;
};

export type GetOrdersParams = {
  instType?: string;     // "SPOT", "SWAP", "FUTURES", "MARGIN", "OPTION"
  instId?: string;
  ordType?: string;
  state?: string;        // "live", "partially_filled", "filled", "canceled"
  after?: string;        // Pagination cursor
  before?: string;
  limit?: string;        // Max 100
};

export type GetBalanceParams = {
  ccy?: string;          // Currency, e.g., "USDT"
};

export type GetPositionsParams = {
  instType?: string;
  instId?: string;
};

export type GetTickerParams = {
  instId: string;
};

export type GetTickersParams = {
  instType: string;
  uly?: string;          // Underlying
};

// OKX API Response Types
export type OkxApiResponse<T> = {
  code: string;          // "0" for success
  msg: string;
  data: T[];
};

export type OkxOrderData = {
  ordId: string;
  clOrdId: string;
  tag: string;
  instId: string;
  side: 'buy' | 'sell';
  ordType: string;
  px: string;
  sz: string;
  state: 'live' | 'partially_filled' | 'filled' | 'canceled' | 'rejected';
  accFillSz: string;     // Accumulated fill quantity
  avgPx: string;         // Average fill price
  cTime: string;         // Creation time (Unix timestamp ms)
  uTime: string;         // Update time
  sCode: string;         // Error code if rejected
  sMsg: string;          // Error message if rejected
};

// Balance detail for a single currency
export type OkxBalanceDetail = {
  ccy: string;                    // Currency
  availBal: string;               // Available balance
  availEq: string;                // Available equity
  cashBal: string;                // Cash balance
  frozenBal: string;              // Frozen balance
  eq: string;                     // Equity of currency
  eqUsd: string;                  // Equity in USD
  upl: string;                    // Unrealized profit and loss
  liab: string;                   // Liabilities
  ordFrozen: string;              // Margin frozen for open orders
  isoEq: string;                  // Isolated margin equity
  isoLiab: string;                // Isolated margin liabilities
  isoUpl: string;                 // Isolated unrealized PnL
  crossLiab: string;              // Cross liabilities
  borrowFroz: string;             // Potential borrowing IMR
  maxLoan: string;                // Max loan
  stgyEq: string;                 // Strategy equity
  spotInUseAmt?: string;          // Spot in use amount
  clSpotInUseAmt?: string;        // Cross-margin spot in use amount
  maxSpotInUse?: string;          // Max spot in use
  spotIsoBal: string;             // Spot isolated balance
  imr: string;                    // Initial margin requirement
  mmr: string;                    // Maintenance margin requirement
  mgnRatio: string;               // Margin ratio
  notionalLever: string;          // Notional leverage
  interest: string;               // Interest
  rewardBal: string;              // Reward balance
  twap: string;                   // TWAP auto buy/sell amount
  uTime: string;                  // Update time (Unix timestamp ms)
  fixedBal: string;               // Fixed balance (for earning)
  spotBal?: string;               // Spot balance
  openAvgPx?: string;             // Average open price
  accAvgPx?: string;              // Accumulated average price
  spotUpl?: string;               // Spot unrealized PnL
  spotUplRatio?: string;          // Spot unrealized PnL ratio
  totalPnl?: string;              // Total PnL
  totalPnlRatio?: string;         // Total PnL ratio
  disEq: string;                  // Discount equity
  smtSyncEq: string;              // Smart sync equity
  spotCopyTradingEq: string;      // Spot copy trading equity
  colRes: string;                 // Collateral reserved
  collateralEnabled: boolean;     // Whether the currency can be used as collateral
  collateralRestrict: boolean;    // Whether collateral is restricted
  colBorrAutoConversion: string;  // Auto conversion for collateral borrowing
  autoLendStatus: string;         // Auto lending status: off/pending/active
  autoLendMtAmt: string;          // Auto lending matched amount
  frpType: string;                // Frozen balance type: 0-normal, 1-auto-borrow, 2-auto-repay
};

// Account balance data
export type OkxBalanceData = {
  uTime: string;                  // Update time (Unix timestamp ms)
  totalEq: string;                // Total equity in USD
  isoEq: string;                  // Isolated margin equity in USD
  adjEq: string;                  // Adjusted equity in USD (for margin mode)
  ordFroz: string;                // Margin frozen for open orders
  imr: string;                    // Initial margin requirement in USD
  mmr: string;                    // Maintenance margin requirement in USD
  borrowFroz: string;             // Potential borrowing IMR in USD
  mgnRatio: string;               // Margin ratio
  notionalUsd: string;            // Notional value of positions in USD
  upl: string;                    // Unrealized profit and loss
  details: OkxBalanceDetail[];    // Balance details for each currency

  // Additional fields for different account modes
  availEq?: string;               // Available equity (for cross margin)
  delta?: string;                 // Delta (for portfolio margin)
  deltaLever?: string;            // Delta leverage (for portfolio margin)
  deltaNeutralStatus?: string;    // Delta neutral status: 0-off, 1-on, 2-pending
  notionalUsdForBorrow?: string;  // Notional USD for borrowing
  notionalUsdForFutures?: string; // Notional USD for futures
  notionalUsdForSwap?: string;    // Notional USD for swaps
  notionalUsdForOption?: string;  // Notional USD for options
};

export type OkxPositionData = {
  instId: string;
  pos: string;           // Position quantity (positive for long, negative for short)
  avgPx: string;         // Average open price
  upl: string;           // Unrealized PnL
  uplRatio: string;      // Unrealized PnL ratio
  lever: string;         // Leverage
  mgnMode: string;       // Margin mode
  notionalUsd: string;   // Notional value in USD
};

export type OkxTickerData = {
  instId: string;
  last: string;          // Last traded price
  lastSz: string;        // Last traded size
  askPx: string;         // Best ask price
  askSz: string;         // Best ask size
  bidPx: string;         // Best bid price
  bidSz: string;         // Best bid size
  open24h: string;       // 24h open price
  high24h: string;       // 24h high
  low24h: string;        // 24h low
  vol24h: string;        // 24h volume
  ts: string;            // Timestamp
};

// Response type aliases
export type OkxOrderResponse = OkxApiResponse<OkxOrderData>;
export type OkxCancelResponse = OkxApiResponse<OkxOrderData>;
export type OkxOrdersResponse = OkxApiResponse<OkxOrderData>;
export type OkxBalanceResponse = OkxApiResponse<OkxBalanceData>;
export type OkxPositionsResponse = OkxApiResponse<OkxPositionData>;
export type OkxTickerResponse = OkxApiResponse<OkxTickerData>;
export type OkxTickersResponse = OkxApiResponse<OkxTickerData>;

// Error Types
export type OkxErrorCategory =
  | 'AUTHENTICATION'      // 50100-50113: Invalid credentials, signature
  | 'RATE_LIMIT'          // 50011: Too many requests
  | 'INSUFFICIENT_BALANCE' // 51008: Insufficient balance
  | 'INVALID_ORDER'       // 51000-51999: Order validation errors
  | 'NETWORK'             // Connection, timeout errors
  | 'SERVER'              // 5xx: OKX server errors
  | 'UNKNOWN';

export class OkxApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public retriable: boolean = false,
    public retryAfterMs?: number
  ) {
    super(message);
    this.name = 'OkxApiError';
  }
}

// Credential Types
export type OkxCredentials = {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
};

// Retry Context
export type RetryContext = {
  operationName: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};
