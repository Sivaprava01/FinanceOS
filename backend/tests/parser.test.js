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

  it('should accurately extract statement period and month from transactions or header text', () => {
    const headerText = 'Statement of Account for the period 01/07/2026 to 31/07/2026';
    const periodFromHeader = parserService.extractStatementPeriod(headerText, []);
    assert.equal(periodFromHeader.statementPeriod, 'July 2026');
    assert.equal(periodFromHeader.statementMonth, 7);
    assert.equal(periodFromHeader.statementYear, 2026);

    const txs = [
      { date: new Date(Date.UTC(2026, 6, 5)) },
      { date: new Date(Date.UTC(2026, 6, 20)) },
      { date: new Date(Date.UTC(2026, 6, 31)) },
    ];
    const periodFromTxs = parserService.extractStatementPeriod('', txs);
    assert.equal(periodFromTxs.statementPeriod, 'July 2026');
    assert.equal(periodFromTxs.statementMonth, 7);
    assert.equal(periodFromTxs.statementYear, 2026);
  });

  it('should correctly classify peer-to-peer incoming UPI payments and cashbacks as Credit', () => {
    const p2pCredit = parserService.detectCategoryAndType(
      '1 01.08.2026 SURESH KUM UPI/SURESH KUM/8407018949@axl/Payment fr/AXIS BANK/483552260724/AXL26a660e256304e0fb9d0 516e07ef7eeb 50.00 28162.80'
    );
    assert.equal(p2pCredit.type, 'Credit');
    assert.equal(p2pCredit.category, 'Other Income');

    const cashback = parserService.detectCategoryAndType(
      '10 03.07.2026 7.00 13510.98 UPI/NPCI BHIM/bhimcashback@h/BHIMCASHBA/HDFC BANK/103600854026/HDF991B3598BC9A4B08B3'
    );
    assert.equal(cashback.type, 'Credit');

    const outgoingPayment = parserService.detectCategoryAndType(
      'UPI/ZOMATO/payzomato@hdfc/Payment to merchant 350.00'
    );
    assert.equal(outgoingPayment.type, 'Debit');
  });

  it('should parse negative and signed amounts correctly in parseAmount', () => {
    assert.equal(parserService.parseAmount('-500.00'), -500.0);
    assert.equal(parserService.parseAmount('-15,000.00'), -15000.0);
    assert.equal(parserService.parseAmount('5,05,931.31'), 505931.31);
    assert.equal(parserService.parseAmount('500.00 (Dr)'), -500.0);
    assert.equal(parserService.parseAmount('500.00 Dr'), -500.0);
    assert.equal(parserService.parseAmount('1,500.00 (Cr)'), 1500.0);
    assert.equal(parserService.parseAmount('(250.00)'), -250.0);
  });

  it('should normalize CSV/Excel row with combined Debit/Credit column and negative amount', () => {
    const row = {
      'Transaction Date': '07 Aug 2026',
      'Transaction Details': 'UPI/VENNAPU AMBEDK/UBIN/263317151259/Car wash',
      'Debit/Credit(₹)': '-500.00',
      'Balance(₹)': '5,05,931.31',
    };

    const normalized = parserService.normalizeRow(row, 'CSV');
    assert.ok(normalized);
    assert.equal(normalized.amount, 500.0);
    assert.equal(normalized.type, 'Debit');
    assert.equal(normalized.merchant, 'VENNAPU AMBEDK');
  });

  it('should accurately extract Debit/Credit amounts instead of running balance from Kotak bank statements', () => {
    const rawText = [
      '1 07 Aug 2026 07 Aug 2026 UPI/VENNAPU AMBEDK/UBIN/263317151259/Car wash UPI-621948632980 -500.00 5,05,931.31',
      '2 07 Aug 2026 07 Aug 2026 MB:SENT TO JAIDEEP CHERAKU/ADVANCE GODOWN KMBT0708260956263543 -15,000.00 5,06,431.31',
      '3 06 Aug 2026 06 Aug 2026 UPI/VENNAPU AMBEDK/UBIN/182435350850/Camera UPI-621801246388 -12,000.00 5,21,431.31',
    ].join('\n');

    const txs = parserService.extractTransactionsFromText(rawText);
    assert.equal(txs.length, 3);

    assert.equal(txs[0].amount, 500.0);
    assert.equal(txs[0].type, 'Debit');

    assert.equal(txs[1].amount, 15000.0);
    assert.equal(txs[1].type, 'Debit');

    assert.equal(txs[2].amount, 12000.0);
    assert.equal(txs[2].type, 'Debit');
  });

  it('should accurately extract amounts from structured PDF pages with Debit/Credit and Balance columns', () => {
    const mockPages = [
      {
        pageNumber: 1,
        rawItems: [
          { str: 'TRANSACTION DATE', x: 50, y: 700, width: 80, height: 10 },
          { str: 'VALUE DATE', x: 140, y: 700, width: 60, height: 10 },
          { str: 'TRANSACTION DETAILS', x: 210, y: 700, width: 120, height: 10 },
          { str: 'DEBIT/CREDIT(₹)', x: 400, y: 700, width: 80, height: 10 },
          { str: 'BALANCE(₹)', x: 500, y: 700, width: 60, height: 10 },
        ],
        lines: [
          {
            y: 650,
            text: '1 07 Aug 2026 07 Aug 2026 UPI/VENNAPU AMBEDK/UBIN/263317151259/Car wash -500.00 5,05,931.31',
            items: [
              { str: '1', x: 30, y: 650, width: 10, height: 10 },
              { str: '07 Aug 2026', x: 50, y: 650, width: 60, height: 10 },
              { str: '07 Aug 2026', x: 140, y: 650, width: 60, height: 10 },
              { str: 'UPI/VENNAPU AMBEDK/UBIN/263317151259/Car wash', x: 210, y: 650, width: 150, height: 10 },
              { str: '-500.00', x: 420, y: 650, width: 40, height: 10 },
              { str: '5,05,931.31', x: 510, y: 650, width: 50, height: 10 },
            ],
          },
        ],
      },
    ];

    const txs = parserService.extractTransactionsFromStructuredPDF(mockPages);
    assert.equal(txs.length, 1);
    assert.equal(txs[0].amount, 500.0);
    assert.equal(txs[0].type, 'Debit');
    assert.equal(txs[0].merchant, 'VENNAPU AMBEDK');
  });
});
