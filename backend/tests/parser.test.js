import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parserService } from '../src/services/parser.service.js';

describe('Parser Service Tests', () => {
  it('should accurately parse date, amount, type, category, and clean merchant from real bank statement row', () => {
    const rawLine =
      '92 31.07.2026 25597.00 31078.72 NEFT-CHASH00020384901-Cognizant Sal Jul 26 COGNIZANT TECHNOLOGY SOLUTION- COGNIZANT TECHNOLOGY-53850 BONTALAKOT';

    // Test helper functions directly
    const date = parserService.parseDate('31.07.2026');
    assert.equal(date.getUTCFullYear(), 2026);
    assert.equal(date.getUTCMonth(), 6); // July is 0-indexed month 6
    assert.equal(date.getUTCDate(), 31);

    const { type, category } = parserService.detectCategoryAndType(rawLine);
    assert.equal(type, 'Credit');
    assert.equal(category, 'Salary');

    const merchant = parserService.extractCleanMerchant(rawLine);
    assert.equal(merchant, 'Cognizant');
  });

  it('should not confuse dot-separated dates with numerical amounts', () => {
    const row = {
      'Date': '31.07.2026',
      'Narration': 'NEFT-CHASH00020384901-Cognizant Sal Jul 26 COGNIZANT TECHNOLOGY SOLUTION',
      'Deposit': '25597.00',
      'Balance': '31078.72',
    };

    const normalized = parserService.normalizeRow(row, 'CSV');
    assert.ok(normalized);
    assert.equal(normalized.amount, 25597.0);
    assert.equal(normalized.type, 'Credit');
    assert.equal(normalized.category, 'Salary');
    assert.equal(normalized.merchant, 'Cognizant');
  });

  it('should correctly infer categories and types for common Indian and international merchants', () => {
    const swiggy = parserService.detectCategoryAndType('UPI/12345/Swiggy/swiggy@icici 450.00');
    assert.equal(swiggy.type, 'Debit');
    assert.equal(swiggy.category, 'Dining');

    const instamart = parserService.detectCategoryAndType('SWIGGY INSTAMART BANGALORE');
    assert.equal(instamart.type, 'Debit');
    assert.equal(instamart.category, 'Groceries');

    const netflix = parserService.detectCategoryAndType('ACH D- NETFLIX ENTERTAINMENT 649.00');
    assert.equal(netflix.type, 'Debit');
    assert.equal(netflix.category, 'Entertainment');

    const interest = parserService.detectCategoryAndType('INTEREST CREDIT FROM BANK 125.50 (Cr)');
    assert.equal(interest.type, 'Credit');
    assert.equal(interest.category, 'Interest Income');
  });

  it('should extract clean merchant names across various narration structures', () => {
    assert.equal(
      parserService.extractCleanMerchant('UPI/524316789/Zomato/paytm@upi 450.00'),
      'Zomato'
    );
    assert.equal(
      parserService.extractCleanMerchant('POS 4012XXXXXXXX1234 STARBUCKS BANGALORE 750.00 (Dr)'),
      'STARBUCKS'
    );
    assert.equal(
      parserService.extractCleanMerchant('ACH D- NETFLIX ENTERTAINMENT 649.00'),
      'NETFLIX ENTERTAINMENT'
    );
  });

  it('should parse various date formats correctly', () => {
    const d1 = parserService.parseDate('2026-07-31');
    assert.equal(d1.toISOString().split('T')[0], '2026-07-31');

    const d2 = parserService.parseDate('31/07/2026');
    assert.equal(d2.toISOString().split('T')[0], '2026-07-31');

    const d3 = parserService.parseDate('31-07-2026');
    assert.equal(d3.toISOString().split('T')[0], '2026-07-31');

    const d4 = parserService.parseDate('31 Jul 2026');
    assert.equal(d4.toISOString().split('T')[0], '2026-07-31');
  });
});
