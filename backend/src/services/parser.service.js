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
import pdfParse from "pdf-parse/lib/pdf-parse.js";
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
 * Strategy: transaction-block assembly.
 *
 * pdf-parse outputs each field of a transaction on its own line — date,
 * merchant, UPI reference lines, and amounts are all separate. To handle
 * this, the parser groups consecutive lines into "blocks" where each block
 * begins with a line that contains a date token. All lines up to the next
 * date-containing line form one transaction block.
 *
 * Within each block:
 *   - The date is extracted from the first line (stripping any leading
 *     serial-number digits, e.g. "106.07.2026" → "06.07.2026").
 *   - The merchant is the next non-empty line after the date line.
 *   - The amounts line is the last line of the block (amounts are
 *     concatenated without spaces, e.g. "899.002510.30").
 *   - The last amount is treated as the closing balance; the first is the
 *     transaction amount.
 *   - Debit vs Credit is determined by whether the deposit column is
 *     populated — detected via the UPI/narration line keywords.
 *
 * Date formats supported (all separator variants):
 *   DD.MM.YYYY  DD/MM/YYYY  DD-MM-YYYY  DD.MM.YY  DD/MM/YY
 *   YYYY-MM-DD  (ISO)
 *   DD MMM YYYY  DD MMM YY  (e.g. "10 Jul 2025")
 *
 * @param {string} text - Raw text from PDF
 * @returns {Array} Array of transactions
 */
const extractTransactionsFromText = (text) => {
  const isDev = process.env.NODE_ENV !== "production";

  // DATE_ANYWHERE — matches a date embedded anywhere in a line.
  //
  // This PDF has lines like "1924.07.2026" (serial "19" fused to date "24.07.2026").
  // We match broadly and then strip any leading serial digits in the extraction step.
  //
  // Match priority:
  //   1. YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD  (year 1900-2099)
  //   2. DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY  (day 01-31, month 01-12)
  //   3. DD MMM YYYY  (word-month)
  const DATE_ANYWHERE = /((?:19|20)\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2}|(?:0[1-9]|[12]\d|3[01])[\/\-\.](?:0[1-9]|1[0-2])[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;

  // Matches a currency amount with mandatory decimal and exactly 2 decimal places.
  // \d+ (not \d{1,3}) so that "5000.00" is captured whole, not as "000.00".
  // Handles comma-formatted numbers: 1,24,550.00 → 124550.00
  // Handles fused amounts: "5000.007460.30" → ["5000.00", "7460.30"]
  const AMOUNT_RE = /\d+(?:,\d{2,3})*\.\d{2}/g;

  const rawLines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // ── Step 1: Identify which lines contain a date ───────────────────────────
  // A "date line" is any line where a date token can be extracted.
  // We record the line index so we can group everything between two date
  // lines into a single transaction block.
  const dateLineIndices = [];
  for (let i = 0; i < rawLines.length; i++) {
    if (DATE_ANYWHERE.test(rawLines[i])) {
      dateLineIndices.push(i);
    }
  }

  if (isDev) {
    console.log(`[Parser] Total non-empty lines: ${rawLines.length} | Lines containing a date: ${dateLineIndices.length}`);
  }

  if (dateLineIndices.length === 0) {
    if (isDev) {
      console.log("[Parser] No date-like tokens found anywhere in the text.");
      console.log("[Parser] First 800 chars:", text.slice(0, 800));
    }
    return [];
  }

  // ── Step 2: Build transaction blocks ─────────────────────────────────────
  // Each block = lines from the current date line up to (not including) the
  // next date line. The last block ends at the end of the document.
  const blocks = [];
  for (let b = 0; b < dateLineIndices.length; b++) {
    const start = dateLineIndices[b];
    const end   = b + 1 < dateLineIndices.length ? dateLineIndices[b + 1] : rawLines.length;
    blocks.push(rawLines.slice(start, end));
  }

  if (isDev) {
    console.log(`[Parser] Transaction blocks identified: ${blocks.length}`);
  }

  // ── Step 3: Parse each block into a transaction ───────────────────────────
  const transactions = [];
  const rejected     = [];

  for (const block of blocks) {
    const dateLine = block[0];

    // ── Extract date ───────────────────────────────────────────────────────
    // The first line of each block is the date line, but it often has a
    // serial number fused directly to the front with no separator:
    //   "106.07.2026"  → serial "1",  date "06.07.2026"
    //   "1924.07.2026" → serial "19", date "24.07.2026"
    //   "06.07.2026"   → no serial,   date "06.07.2026"
    //
    // Algorithm: look for a DD.MM.YYYY pattern (day 01-31, month 01-12)
    // anywhere in the date line. Take the last occurrence so that if
    // serial digits accidentally match something earlier, we still get
    // the real date at the end of the string.
    const DATE_IN_LINE = /(\d{2}\.\d{2}\.\d{4})/g;
    let dateStr = null;
    let dm;
    while ((dm = DATE_IN_LINE.exec(dateLine)) !== null) {
      dateStr = dm[1]; // keep overwriting — last match wins
    }

    // If no DD.MM.YYYY found, fall back to the broad DATE_ANYWHERE match
    if (!dateStr) {
      const fallback = dateLine.match(DATE_ANYWHERE);
      if (fallback) dateStr = fallback[1];
    }

    if (!dateStr) {
      rejected.push({ reason: "no date token found", line: dateLine });
      continue;
    }

    const date = parseDate(dateStr);
    if (!date) {
      rejected.push({ reason: `could not parse date "${dateStr}"`, line: dateLine });
      continue;
    }

    // ── Extract merchant (first non-empty line after the date line) ────────
    const merchant = block.length > 1 ? block[1].substring(0, 100) : "Unknown";

    // ── Collect all text in the block for narration ────────────────────────
    const fullNarration = block.join(" ");

    // ── Extract amounts from block lines AFTER the date line ──────────────
    // Line 0 is the date line (e.g. "106.07.2026"). Scanning it would match
    // "106.07" as an amount via AMOUNT_RE. Actual amounts are always on later
    // lines of the block, so we skip line 0 entirely.
    const amountText = block.slice(1).join(" ");
    AMOUNT_RE.lastIndex = 0;
    const amounts = [];
    let m;
    while ((m = AMOUNT_RE.exec(amountText)) !== null) {
      const n = cleanAmount(m[0]);
      if (n !== null) amounts.push(n);
    }

    if (amounts.length === 0) {
      rejected.push({ reason: "no currency amount found in block", line: dateLine });
      if (isDev) console.log(`[Parser] Rejected block (no amount): "${dateLine}" | block: ${block.join(" | ").slice(0, 120)}`);
      continue;
    }

    // ── Determine debit vs credit ──────────────────────────────────────────
    // This statement has separate Withdrawal and Deposit columns.
    // When it's a Deposit, the amounts line contains: <deposit_amount><balance>
    // When it's a Withdrawal, the amounts line contains: <withdrawal_amount><balance>
    //
    // Heuristic: if narration contains deposit/credit keywords, treat as credit.
    // Otherwise debit.
    const creditKeywords = /\bdeposit\b|credit|salary|received|refund|interest|cashback|\binward\b|\bCr\b/i;
    const isCredit = creditKeywords.test(fullNarration);

    // Last amount is closing balance; first transaction amount is the actual tx
    const balance = amounts.length >= 2 ? amounts[amounts.length - 1] : null;
    const txAmount = amounts[0];

    transactions.push({
      date,
      amount: txAmount,
      type: isCredit ? "Credit" : "Debit",
      merchant,
      description: fullNarration.substring(0, 255),
      originalDate: date,
      originalAmount: txAmount,
      originalType: isCredit ? "Credit" : "Debit",
      originalMerchant: merchant,
      originalDescription: fullNarration.substring(0, 255),
    });
  }

  if (isDev) {
    console.log(`[Parser] Parsed: ${transactions.length} | Rejected: ${rejected.length}`);
    if (rejected.length > 0) {
      console.log("[Parser] Rejected blocks:");
      rejected.forEach((r) => console.log(`  reason="${r.reason}" | line="${r.line.slice(0, 80)}"`));
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

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD — test before DD-MM-YYYY
  const iso = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
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
