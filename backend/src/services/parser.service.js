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
import { Readable } from "stream";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import csv from "csv-parser";
import XLSX from "xlsx";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── PDF Parser ───────────────────────────────────────────────────────────────

/**
 * Extracts text from PDF file using PDF.js with direct password support.
 *
 * @param {Buffer} fileBuffer
 * @param {string} password
 * @returns {Promise<string>}
 */
const loadPDFTextWithPDFJS = async (fileBuffer, password = "") => {
  let PDFJS;
  try {
    const imported = await import("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");
    PDFJS = imported.default || imported;
  } catch (err) {
    throw new Error("PDF parser library unavailable: " + err.message);
  }

  PDFJS.disableWorker = true;
  const param = { data: new Uint8Array(fileBuffer) };
  if (password) {
    param.password = password;
  }

  const doc = await PDFJS.getDocument(param);
  let text = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    let lastY = null;
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      lastY = item.transform[5];
    }
    text += "\n\n";
  }

  doc.destroy();
  return text;
};

/**
 * Extracts text from PDF file and parses transactions.
 *
 * @param {string} filePath - Path to PDF file
 * @param {string} password - PDF password (if encrypted)
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If PDF is invalid or cannot be parsed
 */
const parsePDF = async (filePath, password = "") => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let text = "";

    try {
      text = await loadPDFTextWithPDFJS(fileBuffer, password);
    } catch (parseErr) {
      const errMsg = (parseErr.message || String(parseErr)).toLowerCase();
      const errName = parseErr.name || "";

      // MUST check 'incorrect' or 'invalid' BEFORE checking general 'password' keyword
      if (errMsg.includes("incorrect") || errMsg.includes("invalid") || parseErr.code === 2) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "PDF_INCORRECT_PASSWORD");
      }

      if (
        errMsg.includes("password") ||
        errMsg.includes("encrypted") ||
        errName === "PasswordException" ||
        parseErr.code === 1
      ) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "PDF_PASSWORD_REQUIRED");
      }

      throw parseErr;
    }

    if (!text || text.trim().length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "PDF does not contain extractable text");
    }

    const transactions = extractTransactionsFromText(text);

    if (transactions.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        const sample = text.slice(0, 1500).replace(/\n/g, " ↵ ");
        console.log("[Parser] Extracted text sample (first 1500 chars):", sample);
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
 * Robustly handles metadata rows before header, UTF-8 BOM, varying delimiters, and quoted fields.
 *
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If CSV is invalid or cannot be parsed
 */
const parseCSV = async (filePath) => {
  try {
    let fileContent = fs.readFileSync(filePath, "utf-8");
    // Strip UTF-8 BOM if present
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }

    const lines = fileContent.split(/\r?\n/);
    if (!lines || lines.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "CSV file is empty");
    }

    // Header detection: scan up to 50 lines
    let headerLineIdx = -1;
    let detectedDelimiter = ",";

    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Determine delimiter for this line
      const commaCount = (line.match(/,/g) || []).length;
      const semiCount = (line.match(/;/g) || []).length;
      const tabCount = (line.match(/\t/g) || []).length;

      let delim = ",";
      if (semiCount > commaCount && semiCount > tabCount) delim = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delim = "\t";

      // Split line accounting for quotes or basic split
      const tokens = line
        .toLowerCase()
        .split(delim)
        .map((t) => t.replace(/^["']|["']$/g, "").trim());

      const dateIndicators = tokens.filter(
        (v) =>
          (v.includes("date") &&
            !v.includes("from") &&
            !v.includes("statement") &&
            !v.includes("run")) ||
          v === "dt" ||
          v === "txn date" ||
          v === "transaction date" ||
          v === "value date" ||
          v === "posting date"
      ).length;

      const amountIndicators = tokens.filter(
        (v) =>
          v.includes("amount") ||
          v.includes("debit") ||
          v.includes("credit") ||
          v.includes("withdrawal") ||
          v.includes("deposit") ||
          v === "dr" ||
          v === "cr"
      ).length;

      const descIndicators = tokens.filter(
        (v) =>
          v.includes("description") ||
          v.includes("narration") ||
          v.includes("particulars") ||
          v.includes("merchant") ||
          v.includes("details") ||
          v.includes("remarks") ||
          v.includes("payee")
      ).length;

      if (dateIndicators >= 1 && (amountIndicators >= 1 || descIndicators >= 1)) {
        headerLineIdx = i;
        detectedDelimiter = delim;
        console.log(`[CSV Parser] Detected header line at index ${i} with delimiter '${delim === "\t" ? "\\t" : delim}'`);
        break;
      }
    }

    if (headerLineIdx === -1) {
      // Fallback: search for line containing date or amount keywords
      for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const lower = line.toLowerCase();
        if (
          lower.includes("date") ||
          lower.includes("amount") ||
          lower.includes("debit") ||
          lower.includes("credit") ||
          lower.includes("deposit") ||
          lower.includes("withdrawal")
        ) {
          headerLineIdx = i;
          console.log(`[CSV Parser] Fallback header line detected at index ${i}`);
          break;
        }
      }
    }

    if (headerLineIdx === -1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No transaction header row (Date, Amount/Debit/Credit, Description) could be detected in CSV file."
      );
    }

    // Slice content starting from headerLineIdx
    const csvContentToParse = lines.slice(headerLineIdx).join("\n");

    const transactions = await new Promise((resolve, reject) => {
      const rows = [];
      const stream = Readable.from([csvContentToParse]);

      stream
        .pipe(csv({ separator: detectedDelimiter }))
        .on("data", (row) => {
          try {
            const tx = normalizeRow(row, "CSV");
            if (tx) rows.push(tx);
          } catch (err) {
            // ignore row parse errors
          }
        })
        .on("end", () => resolve(rows))
        .on("error", (err) =>
          reject(new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse CSV stream: " + err.message))
        );
    });

    if (transactions.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `No valid transactions found in CSV file. Scanned ${lines.length - headerLineIdx} data rows.`
      );
    }

    console.log(`[CSV Parser] Successfully extracted ${transactions.length} transactions`);
    return transactions;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse CSV file: " + err.message);
  }
};

// ─── Excel Parser ──────────────────────────────────────────────────────────────

/**
 * Parses Excel (.xls / .xlsx) file and extracts transactions.
 * Robustly detects header rows and handles realistic bank column layouts:
 * - Date | Description | Debit | Credit | Balance
 * - Date | Narration | Withdrawal | Deposit | Balance
 * - Date | Details | Dr | Cr
 * - Date | Merchant | Amount | Type
 *
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If Excel is invalid or cannot be parsed
 */
const parseExcel = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true, raw: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel file contains no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];

    // First, convert sheet to raw 2D array to locate the true header row
    const raw2D = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (!raw2D || raw2D.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No data found in Excel sheet");
    }

    console.log(`[Excel Parser] Sheet "${sheetName}" has ${raw2D.length} rows`);

    // Find the header row by looking for a row that has BOTH:
    // - At least 1 date column indicator
    // - At least 2 amount/debit/credit indicators
    // This avoids false positives from metadata rows that might have a single date
    let headerRowIdx = 0;
    let headerFound = false;
    
    for (let r = 0; r < Math.min(raw2D.length, 50); r++) {
      const rowValues = (raw2D[r] || []).map((v) => String(v).toLowerCase().trim());
      
      const dateIndicators = rowValues.filter(v => 
        (v.includes("date") && !v.includes("from")) ||  // Exclude "date from" (metadata)
        v === "txn date" || 
        (v.includes("transaction date") && !v.includes("from")) ||
        (v.includes("value date") && !v.includes("from")) ||
        (v.includes("posting date") && !v.includes("from"))
      ).length;
      
      const amountIndicators = rowValues.filter(v => 
        v.includes("amount") ||
        v.includes("debit") ||
        v.includes("credit") ||
        v.includes("withdrawal") ||
        v.includes("deposit") ||
        v === "dr" ||
        v === "cr"
      ).length;

      // Require BOTH date AND multiple amount columns for confidence
      if (dateIndicators >= 1 && amountIndicators >= 2) {
        headerRowIdx = r;
        headerFound = true;
        console.log(`[Excel Parser] Detected header row at index ${r}`);
        break;
      }
    }

    if (!headerFound) {
      // Fallback: look for just S.No or similar sequential numbering columns
      for (let r = 0; r < Math.min(raw2D.length, 50); r++) {
        const rowValues = (raw2D[r] || []).map((v) => String(v).toLowerCase().trim());
        if (rowValues.some(v => v === "s no." || v === "s no" || v === "sno" || v === "serial")) {
          headerRowIdx = r;
          headerFound = true;
          console.log(`[Excel Parser] Detected header row at index ${r} (via S.No column)`);
          break;
        }
      }
    }

    if (!headerFound) {
      console.warn(`[Excel Parser] Could not detect header row, trying row 0`);
      headerRowIdx = 0;
    }

    // Convert to JSON objects using detected header row
    const rows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIdx });

    if (!rows || rows.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No valid data rows found in Excel sheet");
    }

    console.log(`[Excel Parser] Found ${rows.length} data rows after header`);

    const transactions = [];
    let rejectedCount = 0;
    
    for (const row of rows) {
      const tx = normalizeRow(row, "XLSX");
      if (tx) {
        transactions.push(tx);
      } else {
        rejectedCount++;
      }
    }

    console.log(`[Excel Parser] Normalized ${transactions.length} transactions, rejected ${rejectedCount} rows`);

    if (transactions.length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST, 
        `No valid transactions found in Excel file. Scanned ${rows.length} rows.`
      );
    }

    return transactions;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`[Excel Parser] Error parsing Excel:`, err.message);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse Excel file: " + err.message);
  }
};

// ─── Row Normalization ─────────────────────────────────────────────────────────

/**
 * Normalizes a row from CSV/Excel into standard transaction format.
 * Dynamically identifies columns for Date, Amount/Type (or Debit/Credit/Withdrawal/Deposit/Dr/Cr),
 * and Merchant/Description/Narration.
 *
 * @param {object} row - Row object from CSV/Excel
 * @param {string} source - "CSV" or "XLSX"
 * @returns {object|null} Normalized transaction or null if invalid
 */
const normalizeRow = (row, source) => {
  if (!row || typeof row !== "object") return null;

  const keys = Object.keys(row);
  if (keys.length === 0) return null;

  // Skip completely empty rows
  const hasAnyData = keys.some((k) => row[k] !== null && row[k] !== "" && row[k] !== undefined);
  if (!hasAnyData) return null;

  // 1. Find and parse Date column (try harder to find it)
  const dateKey = keys.find((k) => {
    const l = k.toLowerCase().trim();
    return (
      l.includes("date") ||
      l === "dt" ||
      l === "txn date" ||
      l === "transaction date" ||
      l === "value date" ||
      l === "post date" ||
      l === "posting date" ||
      l === "tran date"
    );
  });

  const rawDate = dateKey ? row[dateKey] : null;
  const date = rawDate ? parseDate(rawDate) : null;
  if (!date) return null;

  // 2. Find Merchant / Narration / Description columns
  const merchantKey = keys.find((k) => {
    const l = k.toLowerCase().trim();
    return (
      l.includes("merchant") ||
      l.includes("vendor") ||
      l.includes("payee") ||
      l.includes("narration") ||
      l.includes("particulars") ||
      l.includes("description") ||
      l.includes("details") ||
      l.includes("remarks") ||
      l.includes("reference") ||
      l === "ref"
    );
  });

  const merchantRaw = merchantKey ? String(row[merchantKey]).trim() : "Unknown";
  const merchant = merchantRaw.length > 0 ? merchantRaw : "Unknown";

  const descKey = keys.find(
    (k) =>
      k !== merchantKey &&
      (k.toLowerCase().includes("description") ||
        k.toLowerCase().includes("narration") ||
        k.toLowerCase().includes("particulars") ||
        k.toLowerCase().includes("remarks") ||
        k.toLowerCase().includes("details"))
  );
  const description = descKey ? String(row[descKey]).trim() : merchant;

  // 3. Determine Amount and Type (Debit vs Credit)
  let amount = null;
  let type = "Debit";

  // Check for separate Debit / Withdrawal / Dr columns
  const debitKey = keys.find((k) => {
    const l = k.toLowerCase().trim();
    return (
      l.includes("debit") ||
      l.includes("withdrawal") ||
      l.includes("outflow") ||
      l === "dr" ||
      l === "dr." ||
      l.includes("amt debited") ||
      l.includes("withdrawals")
    );
  });

  // Check for separate Credit / Deposit / Cr columns
  const creditKey = keys.find((k) => {
    const l = k.toLowerCase().trim();
    return (
      l.includes("credit") ||
      l.includes("deposit") ||
      l.includes("inflow") ||
      l === "cr" ||
      l === "cr." ||
      l.includes("amt credited") ||
      l.includes("deposits")
    );
  });

  const debitVal = debitKey ? parseAmount(row[debitKey]) : null;
  const creditVal = creditKey ? parseAmount(row[creditKey]) : null;

  if (debitVal !== null && debitVal > 0) {
    amount = debitVal;
    type = "Debit";
  } else if (creditVal !== null && creditVal > 0) {
    amount = creditVal;
    type = "Credit";
  } else {
    // Single Amount column fallback (but NEVER use Balance)
    const balanceKey = keys.find((k) => {
      const l = k.toLowerCase().trim();
      return l.includes("balance") || l.includes("closing") || l.includes("running");
    });

    const amountKey = keys.find((k) => {
      const l = k.toLowerCase().trim();
      // Explicitly exclude balance/closing columns
      if (balanceKey && k === balanceKey) return false;
      if (l.includes("balance") || l.includes("closing")) return false;
      return (
        l.includes("amount") ||
        l === "amt" ||
        l === "sum" ||
        l === "tx amount" ||
        l === "transaction amount" ||
        l === "txn amount" ||
        l.includes("total")
      );
    });

    if (amountKey) {
      const rawAmt = parseAmount(row[amountKey]);
      if (rawAmt !== null && rawAmt !== 0) {
        amount = Math.abs(rawAmt);
        const typeKey = keys.find((k) => {
          const l = k.toLowerCase().trim();
          return l.includes("type") || l === "dr/cr" || l === "d/c" || l.includes("transaction type");
        });

        if (rawAmt < 0) {
          type = "Debit";
        } else if (typeKey) {
          type = parseType(row[typeKey], rawAmt);
        } else {
          type = "Debit";
        }
      }
    }
  }

  if (amount === null || isNaN(amount) || amount <= 0) {
    return null;
  }

  return {
    date,
    amount: Math.abs(amount),
    type,
    merchant: merchant.substring(0, 100),
    description: description.substring(0, 255),
    originalDate: date,
    originalAmount: Math.abs(amount),
    originalType: type,
    originalMerchant: merchant.substring(0, 100),
    originalDescription: description.substring(0, 255),
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
  const DATE_ANYWHERE =
    /((?:19|20)\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2}|(?:0[1-9]|[12]\d|3[01])[\/\-\.](?:0[1-9]|1[0-2])[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;

  // Matches a currency amount with mandatory decimal and exactly 2 decimal places.
  // \d+ (not \d{1,3}) so that "5000.00" is captured whole, not as "000.00".
  // Handles comma-formatted numbers: 1,24,550.00 → 124550.00
  // Handles fused amounts: "5000.007460.30" → ["5000.00", "7460.30"]
  const AMOUNT_RE = /\d+(?:,\d{2,3})*\.\d{2}/g;

  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

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
    console.log(
      `[Parser] Total non-empty lines: ${rawLines.length} | Lines containing a date: ${dateLineIndices.length}`
    );
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
    const end = b + 1 < dateLineIndices.length ? dateLineIndices[b + 1] : rawLines.length;
    blocks.push(rawLines.slice(start, end));
  }

  if (isDev) {
    console.log(`[Parser] Transaction blocks identified: ${blocks.length}`);
  }

  // ── Step 3: Parse each block into a transaction ───────────────────────────
  const transactions = [];
  const rejected = [];

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
      if (isDev)
        console.log(
          `[Parser] Rejected block (no amount): "${dateLine}" | block: ${block.join(" | ").slice(0, 120)}`
        );
      continue;
    }

    // ── Determine debit vs credit ──────────────────────────────────────────
    // This statement has separate Withdrawal and Deposit columns.
    // When it's a Deposit, the amounts line contains: <deposit_amount><balance>
    // When it's a Withdrawal, the amounts line contains: <withdrawal_amount><balance>
    //
    // Heuristic: if narration contains deposit/credit keywords, treat as credit.
    // Otherwise debit.
    const creditKeywords =
      /\bdeposit\b|credit|salary|received|refund|interest|cashback|\binward\b|\bCr\b/i;
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
      rejected.forEach((r) =>
        console.log(`  reason="${r.reason}" | line="${r.line.slice(0, 80)}"`)
      );
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
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  // Handle Excel serial date numbers (e.g. 45384)
  if (typeof dateStr === "number" || (!isNaN(Number(dateStr)) && Number(dateStr) > 25000 && Number(dateStr) < 75000)) {
    const num = Number(dateStr);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d;
  }

  const s = String(dateStr).trim();

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD — test before DD-MM-YYYY
  const iso = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (iso) {
    const year = parseInt(iso[1]);
    const month = parseInt(iso[2]);
    const day = parseInt(iso[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY  (and 2-digit year variants)
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1]);
    const month = parseInt(dmy[2]);
    let year = parseInt(dmy[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(Date.UTC(year, month - 1, day));
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

    const d = new Date(Date.UTC(year, monthIdx, day));

    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to JS Date constructor
  const fallback = new Date(s);

  if (!isNaN(fallback.getTime())) return fallback;

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
    .replace(/,/g, "") // remove thousand separators (1,24,550 → 124550)
    .replace(/[^0-9.\-]/g, "") // strip any other non-numeric characters
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
