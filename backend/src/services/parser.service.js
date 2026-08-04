/**
 * Parser Service
 *
 * Handles extraction of transactions from various file formats:
 * - PDF (text extraction)
 * - CSV (direct parsing)
 * - XLSX (Excel parsing)
 *
 * Normalizes all formats into a common transaction structure.
 * This design allows adding OCR for scanned PDFs later without changing the API.
 *
 * Responsibilities:
 * - Extract text from PDF
 * - Parse CSV data
 * - Parse Excel data
 * - Normalize extracted data to common format
 * - Validate extracted transactions
 *
 * Never stores files — only returns extracted transaction data.
 */

import fs from "fs";
import pdfParse from "pdf-parse";
import csv from "csv-parser";
import XLSX from "xlsx";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── PDF Parser ───────────────────────────────────────────────────────────────

/**
 * Extracts text from PDF file and parses transactions.
 *
 * Current implementation: Text extraction from digital PDFs
 * Future: OCR support can be added here for scanned PDFs
 *
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If PDF is invalid or cannot be parsed
 */
const parsePDF = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "PDF does not contain extractable text");
    }

    // Extract transactions from PDF text using pattern matching
    const transactions = extractTransactionsFromText(text);

    if (transactions.length === 0) {
      // In dev, print a sample so the developer can see what was extracted
      if (process.env.NODE_ENV !== "production") {
        const sample = text.slice(0, 1500).replace(/\n/g, " ↵ ");
        console.log("[Parser] Extracted text sample (first 1500 chars):");
        console.log(sample);
        console.log("[Parser] Check the lines above against the date/amount patterns.");
      }
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No transactions found in PDF. Ensure it's a valid bank statement."
      );
    }

    return transactions;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse PDF file: " + err.message);
  }
};

// ─── CSV Parser ────────────────────────────────────────────────────────────────

/**
 * Parses CSV file and extracts transactions.
 *
 * Supports various CSV formats from different banks.
 * Looks for common column names: Date, Amount, Description, Merchant, Type, etc.
 *
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If CSV is invalid or cannot be parsed
 */
const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const transactions = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const transaction = normalizeRow(row, "CSV");
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (err) {
          errors.push(err.message);
        }
      })
      .on("end", () => {
        if (transactions.length === 0) {
          reject(
            new ApiError(
              HTTP_STATUS.BAD_REQUEST,
              "No valid transactions found in CSV file"
            )
          );
        } else {
          resolve(transactions);
        }
      })
      .on("error", (err) => {
        reject(new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse CSV file: " + err.message));
      });
  });
};

// ─── Excel Parser ──────────────────────────────────────────────────────────────

/**
 * Parses Excel (XLSX) file and extracts transactions.
 *
 * Reads the first sheet and looks for transaction data.
 *
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If Excel is invalid or cannot be parsed
 */
const parseExcel = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel file contains no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No data found in Excel sheet");
    }

    const transactions = rows
      .map((row) => normalizeRow(row, "XLSX"))
      .filter((t) => t !== null);

    if (transactions.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No valid transactions found in Excel file");
    }

    return transactions;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse Excel file: " + err.message);
  }
};

// ─── Row Normalization ─────────────────────────────────────────────────────────

/**
 * Normalizes a row from CSV/Excel into standard transaction format.
 * Handles various column naming conventions.
 *
 * @param {object} row - Row from CSV/Excel
 * @param {string} source - "CSV" or "XLSX"
 * @returns {object|null} Normalized transaction or null if invalid
 */
const normalizeRow = (row, source) => {
  // Find and parse date
  const dateField = Object.keys(row).find((k) => k.toLowerCase().includes("date"));
  const date = dateField ? parseDate(row[dateField]) : null;
  if (!date) return null;

  // Find and parse amount
  const amountField = Object.keys(row).find((k) => k.toLowerCase().includes("amount"));
  const amount = amountField ? parseAmount(row[amountField]) : null;
  if (amount === null) return null;

  // Determine type (Debit/Credit)
  const typeField = Object.keys(row).find((k) => k.toLowerCase().includes("type"));
  const type = typeField ? parseType(row[typeField], amount) : "Debit";

  // Find merchant/description
  const merchantField = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes("merchant") ||
      k.toLowerCase().includes("vendor") ||
      k.toLowerCase().includes("description")
  );
  const merchant = merchantField ? String(row[merchantField]).trim() : "Unknown";

  // Find description
  const descField = Object.keys(row).find(
    (k) => k.toLowerCase().includes("description") && k !== merchantField
  );
  const description = descField ? String(row[descField]).trim() : "";

  return {
    date,
    amount: Math.abs(amount),
    type,
    merchant,
    description,
    originalDate: date,
    originalAmount: Math.abs(amount),
    originalType: type,
    originalMerchant: merchant,
    originalDescription: description,
  };
};

// ─── Text Extraction (PDF) ────────────────────────────────────────────────────

/**
 * Extracts transactions from PDF text using pattern matching.
 *
 * Approach:
 * - Scan every line for a recognised date at the start (or near the start).
 * - Once a date anchor is found, extract all currency amounts from the
 *   remainder of the line (everything after the date token).
 * - Assign debit/credit/balance from the amount columns using a keyword
 *   heuristic — no bank-specific column positions are hardcoded.
 * - Lines that span multiple rows (narration continues on next line) are
 *   joined before parsing using a look-ahead that checks whether the
 *   following line starts with a date anchor.
 *
 * @param {string} text - Raw text from PDF
 * @returns {Array} Array of transactions
 */
const extractTransactionsFromText = (text) => {
  const isDev = process.env.NODE_ENV !== "production";

  // Matches a date token at the start of a line (after optional whitespace).
  // Supported formats:
  //   DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
  //   DD/MM/YY    DD-MM-YY
  //   YYYY-MM-DD  (ISO)
  //   DD MMM YYYY  DD MMM YY  (e.g. 10 Jul 2025)
  const DATE_AT_START = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;

  // Matches a currency amount: 1-7 digits, optional comma-groups, mandatory decimal
  // Examples: 450.00  10,000.00  1,24,550.00  1,899.00
  const AMOUNT_RE = /\d{1,3}(?:,\d{2,3})*\.\d{2}/g;

  // ── Step 1: Merge continuation lines ──────────────────────────────────────
  // pdf-parse sometimes splits a narration across two lines.
  // A continuation line has no date anchor at its start.
  const rawLines = text.split("\n");
  const mergedLines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    if (DATE_AT_START.test(line)) {
      // Peek: if the next non-empty line does NOT start with a date, it is a
      // continuation of the narration — merge it in.
      let merged = line;
      while (i + 1 < rawLines.length) {
        const next = rawLines[i + 1].trim();
        if (next && !DATE_AT_START.test(next)) {
          merged += " " + next;
          i++;
        } else {
          break;
        }
      }
      mergedLines.push(merged);
    }
    // Lines without a date anchor are skipped (headers, footers, etc.)
  }

  if (isDev) {
    console.log(`[Parser] Total lines in PDF: ${rawLines.length} | Lines with date anchor: ${mergedLines.length}`);
  }

  // ── Step 2: Parse each date-anchored line ──────────────────────────────────
  const transactions = [];
  const rejected = [];

  for (const line of mergedLines) {
    const dateMatch = line.match(DATE_AT_START);
    if (!dateMatch) continue;

    const date = parseDate(dateMatch[0]);
    if (!date) {
      rejected.push({ reason: "unparseable date", line });
      continue;
    }

    // Everything after the date token is amounts + narration
    const remainder = line.slice(dateMatch[0].length).trim();

    // Reset lastIndex before exec loop
    AMOUNT_RE.lastIndex = 0;
    const amounts = [];
    let m;
    while ((m = AMOUNT_RE.exec(remainder)) !== null) {
      const n = cleanAmount(m[0]);
      if (n !== null) amounts.push(n);
    }

    if (amounts.length === 0) {
      rejected.push({ reason: "no currency amount found", line });
      continue;
    }

    // Extract description: text before the first amount, stripped of ref numbers
    const firstAmountPos = remainder.search(AMOUNT_RE);
    AMOUNT_RE.lastIndex = 0;
    let description = (firstAmountPos > 0 ? remainder.slice(0, firstAmountPos) : remainder)
      .replace(/\s+\d{9,}\s*/g, " ")  // strip long reference/cheque numbers
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!description) description = "Unknown";

    // ── Amount column assignment heuristic ───────────────────────────────────
    // Banks use 2- or 3-amount column layouts:
    //   2 amounts: [transaction_amount, closing_balance]
    //   3 amounts: [debit, credit, closing_balance]  (one of debit/credit is 0 or absent)
    //
    // The closing balance is always the largest value on the line.
    // If only one non-balance amount exists, use description keywords to
    // determine debit vs credit.
    let debit = null;
    let credit = null;
    let balance = null;

    if (amounts.length === 1) {
      // Only one amount — treat as transaction amount, no balance available
      const creditKeywords = /credit|deposit|salary|received|refund|interest|cashback/i;
      if (creditKeywords.test(description)) {
        credit = amounts[0];
      } else {
        debit = amounts[0];
      }
    } else if (amounts.length === 2) {
      // Last amount is almost always the closing balance (largest running total)
      balance = amounts[amounts.length - 1];
      const txAmount = amounts[0];
      const creditKeywords = /credit|deposit|salary|received|refund|interest|cashback/i;
      if (creditKeywords.test(description)) {
        credit = txAmount;
      } else {
        debit = txAmount;
      }
    } else {
      // 3+ amounts: last is balance; work out debit vs credit from positions
      balance = amounts[amounts.length - 1];
      const a = amounts[amounts.length - 3]; // likely debit column
      const b = amounts[amounts.length - 2]; // likely credit column
      // Whichever is non-zero (they can't both be non-zero on the same line)
      if (a > 0 && b === 0) {
        debit = a;
      } else if (b > 0 && a === 0) {
        credit = b;
      } else {
        // Both non-zero — use keyword heuristic
        const creditKeywords = /credit|deposit|salary|received|refund|interest|cashback/i;
        if (creditKeywords.test(description)) {
          credit = b || a;
        } else {
          debit = a || b;
        }
      }
    }

    transactions.push({
      date,
      amount: debit ?? credit ?? amounts[0],
      type: credit !== null ? "Credit" : "Debit",
      merchant: description.substring(0, 100),
      description: line,
      originalDate: date,
      originalAmount: debit ?? credit ?? amounts[0],
      originalType: credit !== null ? "Credit" : "Debit",
      originalMerchant: description.substring(0, 100),
      originalDescription: line,
    });
  }

  if (isDev) {
    console.log(`[Parser] Parsed: ${transactions.length} | Rejected: ${rejected.length}`);
    if (rejected.length > 0) {
      console.log("[Parser] Rejected lines:");
      rejected.forEach((r) => console.log(`  [${r.reason}] ${r.line.slice(0, 80)}`));
    }
  }

  return transactions;
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Parses a date string in various formats into a JavaScript Date.
 *
 * Supported formats:
 *   YYYY-MM-DD            (ISO — groups are year/month/day, not day/month/year)
 *   DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
 *   DD/MM/YY    DD-MM-YY
 *   DD MMM YYYY  DD MMM YY  (e.g. "10 Jul 2025", "01 Jan 25")
 *
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {Date|null} Parsed Date object or null if invalid
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  const s = String(dateStr).trim();

  // YYYY-MM-DD (ISO format) — must test before DD-MM-YYYY to avoid misparse
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = parseInt(iso[1]);
    const month = parseInt(iso[2]);
    const day = parseInt(iso[3]);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY  (and 2-digit year variants)
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1]);
    const month = parseInt(dmy[2]);
    let year = parseInt(dmy[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  // DD MMM YYYY  or  DD MMM YY  (e.g. "10 Jul 2025", "01 Jan 25")
  const dMonthY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (dMonthY) {
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const day = parseInt(dMonthY[1]);
    const monthIdx = months[dMonthY[2].toLowerCase()];
    let year = parseInt(dMonthY[3]);
    if (monthIdx === undefined) return null;
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, monthIdx, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

/**
 * Parses amount string into a number.
 * Strips thousand-separator commas before parsing.
 * Commas are REMOVED (not replaced with dots) — "1,24,550.00" → 124550.00.
 *
 * @param {string|number} amountStr - Amount string or number
 * @returns {number|null} Parsed amount or null if invalid
 */
const parseAmount = (amountStr) => {
  if (!amountStr) return null;
  if (typeof amountStr === "number") return amountStr;

  // Strip everything except digits, a single dot, and a leading minus
  const cleaned = String(amountStr)
    .replace(/,/g, "")           // remove thousand separators (1,24,550 → 124550)
    .replace(/[^0-9.\-]/g, "")  // strip any other non-numeric characters
    .trim();

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
};

/**
 * Cleans a matched currency amount string into a float.
 * Identical to parseAmount but named clearly for use within extractTransactionsFromText.
 *
 * @param {string} str
 * @returns {number|null}
 */
const cleanAmount = (str) => parseAmount(str);

/**
 * Determines transaction type (Debit or Credit).
 *
 * @param {string} typeStr - Type string from file
 * @param {number} amount - Amount (can be negative for debit)
 * @returns {string} "Debit" or "Credit"
 */
const parseType = (typeStr, amount) => {
  if (!typeStr) {
    return amount < 0 ? "Debit" : "Credit";
  }

  const lower = String(typeStr).toLowerCase();
  if (lower.includes("debit") || lower.includes("withdrawal") || lower.includes("expense")) {
    return "Debit";
  }
  if (lower.includes("credit") || lower.includes("deposit") || lower.includes("income")) {
    return "Credit";
  }

  return amount < 0 ? "Debit" : "Credit";
};

// ─── Export Service ───────────────────────────────────────────────────────────

export const parserService = {
  parsePDF,
  parseCSV,
  parseExcel,
};
