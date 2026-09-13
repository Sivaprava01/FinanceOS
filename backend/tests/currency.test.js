import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCurrency,
  normalizeCurrencyCode,
  detectStatementCurrency,
  convertCurrency,
  SUPPORTED_CURRENCIES,
} from '../src/utils/currency.js';

describe('Currency Utility Tests', () => {
  it('should validate standard ISO currency codes', () => {
    assert.equal(isValidCurrency('USD'), true);
    assert.equal(isValidCurrency('EUR'), true);
    assert.equal(isValidCurrency('GBP'), true);
    assert.equal(isValidCurrency('INR'), true);
    assert.equal(isValidCurrency('CAD'), true);
    assert.equal(isValidCurrency('AUD'), true);
    assert.equal(isValidCurrency('JPY'), true);
    assert.equal(isValidCurrency('INVALID_CODE'), false);
    assert.equal(isValidCurrency(''), false);
  });

  it('should normalize lowercase and whitespace currency codes', () => {
    assert.equal(normalizeCurrencyCode('  usd  '), 'USD');
    assert.equal(normalizeCurrencyCode('inr'), 'INR');
    assert.equal(normalizeCurrencyCode('eur'), 'EUR');
  });

  it('should detect currency from explicit statement text headers', () => {
    const text = 'Account Statement\nCurrency: AUD\nPeriod: 01/01/2026 to 31/01/2026';
    const result = detectStatementCurrency(text);
    assert.equal(result.currency, 'AUD');
    assert.equal(result.confidence, 'high');
  });

  it('should detect currency from symbol context', () => {
    const text = 'Bank Statement\nTotal Balance: ₹1,50,000.00\nTransactions:';
    const result = detectStatementCurrency(text);
    assert.equal(result.currency, 'INR');
  });

  it('should convert currency locally when currencies match', async () => {
    const result = await convertCurrency(100, 'USD', 'USD');
    assert.equal(result.converted, 100);
    assert.equal(result.rate, 1);
  });
});
