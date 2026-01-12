import crypto from 'node:crypto';
import type { TradingMode } from '@exchange/types.js';
import type { OkxCredentials } from './types.js';
import { loadCredentials as loadStoredCredentials } from '@config/credentials.js';

export class OkxCredentialManager {
  private credentials: OkxCredentials;

  constructor(private tradingMode: TradingMode) {
    this.credentials = this.loadCredentials();
    this.validateCredentials();
  }

  /**
   * Load API credentials from environment variables or stored file based on trading mode
   */
  private loadCredentials(): OkxCredentials {
    if (this.tradingMode === 'DRY_RUN') {
      // DRY_RUN mode doesn't need real credentials
      return {
        apiKey: 'dry-run-key',
        apiSecret: 'dry-run-secret',
        apiPassphrase: 'dry-run-passphrase'
      };
    }

    // 优先从环境变量读取
    const prefix = this.tradingMode === 'PAPER' ? 'OKX_PAPER_' : 'OKX_';
    const envApiKey = process.env[`${prefix}API_KEY`];
    const envApiSecret = process.env[`${prefix}API_SECRET`];
    const envApiPassphrase = process.env[`${prefix}API_PASSPHRASE`];

    if (envApiKey && envApiSecret && envApiPassphrase) {
      console.log(`[OKX] Using credentials from environment variables for ${this.tradingMode} mode`);
      return {
        apiKey: envApiKey,
        apiSecret: envApiSecret,
        apiPassphrase: envApiPassphrase
      };
    }

    // 从存储文件读取
    const storedCreds = loadStoredCredentials();
    if (storedCreds) {
      console.log(`[OKX] Using credentials from stored file for ${this.tradingMode} mode`);
      if (this.tradingMode === 'PAPER') {
        return {
          apiKey: storedCreds.paperApiKey,
          apiSecret: storedCreds.paperApiSecret,
          apiPassphrase: storedCreds.paperApiPassphrase
        };
      } else {
        // LIVE mode
        if (storedCreds.liveApiKey && storedCreds.liveApiSecret && storedCreds.liveApiPassphrase) {
          return {
            apiKey: storedCreds.liveApiKey,
            apiSecret: storedCreds.liveApiSecret,
            apiPassphrase: storedCreds.liveApiPassphrase
          };
        }
      }
    }

    throw new Error(
      `Missing OKX API credentials for ${this.tradingMode} mode. ` +
      `Please configure credentials via UI Settings page or set environment variables: ` +
      `${prefix}API_KEY, ${prefix}API_SECRET, ${prefix}API_PASSPHRASE`
    );
  }

  /**
   * Validate that all required credential fields are present
   */
  private validateCredentials(): void {
    const { apiKey, apiSecret, apiPassphrase } = this.credentials;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key is required but empty');
    }

    if (!apiSecret || apiSecret.trim() === '') {
      throw new Error('API Secret is required but empty');
    }

    if (!apiPassphrase || apiPassphrase.trim() === '') {
      throw new Error('API Passphrase is required but empty');
    }

    // Additional validation: prevent production credentials in PAPER mode
    // This is a simple heuristic - production keys typically don't contain "demo" or "paper"
    if (this.tradingMode === 'PAPER') {
      const keyLower = apiKey.toLowerCase();
      if (!keyLower.includes('demo') && !keyLower.includes('paper') && !keyLower.includes('test')) {
        console.warn(
          'WARNING: Using credentials that may not be for demo trading in PAPER mode. ' +
          'Ensure you are using demo account credentials.'
        );
      }
    }
  }

  /**
   * Get the loaded credentials
   */
  getCredentials(): OkxCredentials {
    return { ...this.credentials };
  }

  /**
   * Generate HMAC-SHA256 signature for OKX API request
   * 
   * Signature algorithm:
   * 1. Create pre-hash string: timestamp + method + requestPath + body
   * 2. Sign with HMAC-SHA256 using apiSecret
   * 3. Encode result as Base64
   * 
   * @param timestamp ISO 8601 timestamp string
   * @param method HTTP method (GET, POST, etc.)
   * @param path Request path (e.g., "/api/v5/trade/order")
   * @param body Request body as string (empty string for GET requests)
   * @returns Base64-encoded signature
   */
  signRequest(timestamp: string, method: string, path: string, body: string): string {
    // Create the pre-hash string
    const prehash = timestamp + method.toUpperCase() + path + body;

    // Sign with HMAC-SHA256
    const hmac = crypto.createHmac('sha256', this.credentials.apiSecret);
    hmac.update(prehash);

    // Return Base64-encoded signature
    return hmac.digest('base64');
  }

  /**
   * Get API key for request headers
   */
  getApiKey(): string {
    return this.credentials.apiKey;
  }

  /**
   * Get API passphrase for request headers
   */
  getApiPassphrase(): string {
    return this.credentials.apiPassphrase;
  }
}
