#!/usr/bin/env tsx
/**
 * Test script for credentials management
 * Usage: npm run test:credentials
 */

import 'dotenv/config';
import { loadCredentials, saveCredentials, getMaskedCredentials } from '../src/config/credentials.js';

console.log('=== OKX Credentials Test ===\n');

// Test 1: Load credentials
console.log('1. Testing credential loading...');
const credentials = loadCredentials();

if (credentials) {
  console.log('✓ Credentials loaded successfully');
  console.log('  Source:', process.env.OKX_PAPER_API_KEY ? 'Environment Variables' : 'Stored File');
  console.log('  Paper API Key:', credentials.paperApiKey ? '✓ Set' : '✗ Not set');
  console.log('  Paper API Secret:', credentials.paperApiSecret ? '✓ Set' : '✗ Not set');
  console.log('  Paper API Passphrase:', credentials.paperApiPassphrase ? '✓ Set' : '✗ Not set');
  console.log('  Live API Key:', credentials.liveApiKey ? '✓ Set' : '✗ Not set');
} else {
  console.log('✗ No credentials found');
}

// Test 2: Get masked credentials
console.log('\n2. Testing masked credentials...');
const masked = getMaskedCredentials();
console.log('  Masked Paper API Key:', masked.paperApiKey || 'N/A');
console.log('  Masked Paper API Secret:', masked.paperApiSecret || 'N/A');
console.log('  Masked Paper API Passphrase:', masked.paperApiPassphrase || 'N/A');

// Test 3: Save and reload (optional)
if (process.argv.includes('--test-save')) {
  console.log('\n3. Testing save and reload...');
  
  const testCreds = {
    paperApiKey: 'test-key-' + Date.now(),
    paperApiSecret: 'test-secret-' + Date.now(),
    paperApiPassphrase: 'test-pass-' + Date.now()
  };

  console.log('  Saving test credentials...');
  saveCredentials(testCreds);
  console.log('  ✓ Saved');

  console.log('  Reloading credentials...');
  // Clear env vars to force file load
  const envKey = process.env.OKX_PAPER_API_KEY;
  delete process.env.OKX_PAPER_API_KEY;
  delete process.env.OKX_PAPER_API_SECRET;
  delete process.env.OKX_PAPER_API_PASSPHRASE;

  const reloaded = loadCredentials();
  
  if (reloaded && reloaded.paperApiKey === testCreds.paperApiKey) {
    console.log('  ✓ Credentials match after reload');
  } else {
    console.log('  ✗ Credentials do not match');
  }

  // Restore env var
  if (envKey) {
    process.env.OKX_PAPER_API_KEY = envKey;
  }
}

console.log('\n=== Test Complete ===');
