#!/usr/bin/env tsx
/**
 * Test script for OKX balance API
 * Usage: npm run test:balance
 */

import 'dotenv/config';
import { OkxBroker } from '../src/exchange/okxBroker.js';
import { TradingMode } from '../src/exchange/types.js';

const tradingMode = (process.env.TRADING_MODE || 'PAPER') as TradingMode;

console.log('=== OKX Balance API Test ===\n');
console.log(`Trading Mode: ${tradingMode}\n`);

if (tradingMode === 'DRY_RUN') {
  console.log('⚠️  DRY_RUN mode does not support real API calls');
  console.log('Please set TRADING_MODE=PAPER in .env file\n');
  process.exit(0);
}

async function testBalance() {
  try {
    console.log('1. Initializing OKX Broker...');
    const broker = new OkxBroker(tradingMode);
    console.log('✓ Broker initialized\n');

    console.log('2. Fetching account balance...');
    const balance = await broker.fetchBalance();
    console.log('✓ Balance fetched successfully\n');

    console.log('Account Balance:');
    console.log('  Total:', balance.total, 'USDT');
    console.log('  Available:', balance.available, 'USDT');
    console.log('  In Use:', (balance.total - balance.available).toFixed(2), 'USDT');

    console.log('\n3. Fetching positions...');
    const positions = await broker.fetchPositions();
    console.log(`✓ Found ${positions.length} position(s)\n`);

    if (positions.length > 0) {
      console.log('Open Positions:');
      positions.forEach((pos, idx) => {
        console.log(`  ${idx + 1}. ${pos.symbol}`);
        console.log(`     Side: ${pos.side}`);
        console.log(`     Size: ${pos.size}`);
        console.log(`     Entry: ${pos.entryPrice}`);
        console.log(`     Current: ${pos.currentPrice}`);
        console.log(`     PnL: ${pos.unrealizedPnl}`);
      });
    } else {
      console.log('  No open positions');
    }

    console.log('\n4. Fetching pending orders...');
    const orders = await broker.fetchOrders();
    console.log(`✓ Found ${orders.length} pending order(s)\n`);

    if (orders.length > 0) {
      console.log('Pending Orders:');
      orders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.symbol}`);
        console.log(`     Side: ${order.side}`);
        console.log(`     Type: ${order.type}`);
        console.log(`     Size: ${order.size}`);
        console.log(`     Price: ${order.price || 'Market'}`);
        console.log(`     Status: ${order.status}`);
      });
    } else {
      console.log('  No pending orders');
    }

    console.log('\n=== Test Complete ===');
    console.log('✓ All API calls successful');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    if (error instanceof Error) {
      console.error('  Message:', error.message);
      console.error('  Stack:', error.stack);
    }
    process.exit(1);
  }
}

testBalance();
