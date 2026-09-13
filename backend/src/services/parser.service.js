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
import csv from "csv-parser";
import XLSX from "xlsx";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import { detectStatementCurrency } from "../utils/currency.js";

// ─── PDF Parser ───────────────────────────────────────────────────────────────

/**
 * Extracts structured text and item coordinates from PDF file using PDF.js with direct password support.
 * Groups items into horizontal lines based on visual Y-coordinate alignment.
 *
 * @param {Buffer} fileBuffer
 * @param {string} password
 * @returns {Promise<{ pages: Array, fullText: string }>}
 */
const loadPDFStructuredDataWithPDFJS = async (fileBuffer, password = "") => {
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
  const pages = [];
  let fullText = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const rawItems = [];

    for (const item of textContent.items) {
      const str = item.str;
      if (!str || str.trim().length === 0) continue;
      const x = item.transform ? item.transform[4] : 0;
      const y = item.transform ? item.transform[5] : 0;
      const width = item.width || 0;
      const height = item.height || 0;
      rawItems.push({ str, x, y, width, height });
    }

    // Cluster items into horizontal lines based on Y proximity (within 3px)
    const lines = [];
    rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

    for (const item of rawItems) {
      let matchedLine = null;
      for (const line of lines) {
        if (Math.abs(line.y - item.y) <= 3.0) {
          matchedLine = line;
          break;
        }
      }
      if (matchedLine) {
        matchedLine.items.push(item);
      } else {
        lines.push({
          y: item.y,
          items: [item],
        });
      }
    }

    // Sort items horizontally by X coordinate ascending
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
      let lineStr = "";
      let prevItem = null;
      for (const it of line.items) {
        if (prevItem) {
          const gap = it.x - (prevItem.x + prevItem.width);
          if (gap > 1.5) {
            lineStr += " ";
          }
        }
        lineStr += it.str;
        prevItem = it;
      }
      line.text = lineStr.trim();
    }

    // Sort lines from top of page to bottom
    lines.sort((a, b) => b.y - a.y);
    pages.push({ pageNumber: i, lines, rawItems });

    const pageText = lines.map((l) => l.text).filter(Boolean).join("\n");
    fullText += pageText + "\n\n";
  }

  doc.destroy();
  return { pages, fullText };
};

/**
 * Extracts text from PDF file and parses transactions using coordinate-aware 2D extraction.
 *
 * @param {string} filePath - Path to PDF file
 * @param {string} password - PDF password (if encrypted)
 * @returns {Promise<Array>} Array of extracted transactions
 * @throws {ApiError} If PDF is invalid or cannot be parsed
 */
const parsePDF = async (filePath, password = "") => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let pdfData = null;

    try {
      pdfData = await loadPDFStructuredDataWithPDFJS(fileBuffer, password);
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

    const { pages, fullText } = pdfData;

    if (!fullText || fullText.trim().length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "PDF does not contain extractable text");
    }

    // Attempt coordinate-aware 2D structured extraction first
    let transactions = extractTransactionsFromStructuredPDF(pages);

    // Fall back to robust block text extraction if structured returned no rows
    if (!transactions || transactions.length === 0) {
      transactions = extractTransactionsFromText(fullText);
    }

    if (transactions.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        const sample = fullText.slice(0, 1500).replace(/\n/g, " ↵ ");
        console.log("[Parser] Extracted text sample (first 1500 chars):", sample);
      }
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No transactions found in PDF. Ensure it's a valid bank statement."
      );
    }

    const detected = detectStatementCurrency(fullText);
    transactions.detectedCurrency = detected.currency;
    transactions.isAmbiguous = detected.isAmbiguous;
    transactions.confidence = detected.confidence;
    transactions.detectedSources = detected.detectedSources;

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

    const detected = detectStatementCurrency(fileContent, lines.slice(0, 20));
    transactions.detectedCurrency = detected.currency;
    transactions.isAmbiguous = detected.isAmbiguous;
    transactions.confidence = detected.confidence;
    transactions.detectedSources = detected.detectedSources;

    console.log(`[CSV Parser] Successfully extracted ${transactions.length} transactions, detected currency: ${detected.currency || "none"}`);
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

      const descIndicators = rowValues.filter(v =>
        v.includes("description") ||
        v.includes("particulars") ||
        v.includes("narration") ||
        v.includes("merchant") ||
        v.includes("details") ||
        v.includes("payee") ||
        v.includes("remarks")
      ).length;

      // Require date AND amount (or date + amount + description)
      if (dateIndicators >= 1 && amountIndicators >= 1 && (amountIndicators >= 2 || descIndicators >= 1 || rowValues.length <= 6)) {
        headerRowIdx = r;
        headerFound = true;
        console.log(`[Excel Parser] Detected header row at index ${r}`);
        break;
      }
    }

    if (!headerFound) {
      // Fallback 1: look for any row with date AND amount
      for (let r = 0; r < Math.min(raw2D.length, 50); r++) {
        const rowValues = (raw2D[r] || []).map((v) => String(v).toLowerCase().trim());
        const dateInd = rowValues.filter(v => v.includes("date") && !v.includes("from")).length;
        const amtInd = rowValues.filter(v => v.includes("amount") || v.includes("debit") || v.includes("credit")).length;
        if (dateInd >= 1 && amtInd >= 1) {
          headerRowIdx = r;
          headerFound = true;
          console.log(`[Excel Parser] Detected header row at index ${r} (relaxed date+amount)`);
          break;
        }
      }
    }

    if (!headerFound) {
      // Fallback 2: look for just S.No or similar sequential numbering columns
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
      console.warn("[Excel Parser] Could not detect header row, trying row 0");
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

    const sampleText = raw2D.slice(0, 25).map((r) => Array.isArray(r) ? r.join(" ") : String(r)).join("\n");
    const detected = detectStatementCurrency(sampleText, raw2D.slice(0, 25));
    transactions.detectedCurrency = detected.currency;
    transactions.isAmbiguous = detected.isAmbiguous;
    transactions.confidence = detected.confidence;
    transactions.detectedSources = detected.detectedSources;

    console.log(`[Excel Parser] Extracted ${transactions.length} transactions, detected currency: ${detected.currency || "none"}`);
    return transactions;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("[Excel Parser] Error parsing Excel:", err.message);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to parse Excel file: " + err.message);
  }
};

// ─── Constants & Regex ────────────────────────────────────────────────────────

const DATE_MASK_RE = /\b(?:\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}|\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/gi;
const STRICT_AMOUNT_PATTERN = /(?:[-+])?(?<![.\d])(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}(?![.\d])(?:\s*\((?:Dr|Cr)\)|\s*(?:Dr|Cr))?/gi;

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
const normalizeRow = (row, _source) => {
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
          const detected = detectCategoryAndType(`${description} ${merchantRaw}`, rawAmt);
          type = detected.type;
        }
      }
    }
  }

  if (amount === null || isNaN(amount) || amount <= 0) {
    return null;
  }

  const detectedInfo = detectCategoryAndType(`${description} ${merchantRaw}`, type === "Credit" ? amount : -amount);
  const cleanMerchant = extractCleanMerchant(merchantRaw !== "Unknown" ? merchantRaw : description);

  return {
    date,
    amount: Math.abs(amount),
    type,
    category: detectedInfo.category,
    merchant: cleanMerchant.substring(0, 100),
    description: description.substring(0, 255),
    originalDate: date,
    originalAmount: Math.abs(amount),
    originalType: type,
    originalMerchant: cleanMerchant.substring(0, 100),
    originalDescription: description.substring(0, 255),
  };
};

// ─── Text Extraction Helpers ──────────────────────────────────────────────────

/**
 * Detects transaction type (Credit vs Debit) and auto-infers default category.
 *
 * @param {string} text - Transaction narration or row text
 * @param {number|null} explicitAmount - Numerical amount if negative/positive signed
 * @returns {{ type: "Credit"|"Debit", category: string }}
 */
const detectCategoryAndType = (text, explicitAmount = null) => {
  const lower = String(text || "").toLowerCase();

  // 1. Explicit Dr/Cr indicators
  const isExplicitDr =
    /\((?:dr)\)|\bdr\b|\bdr\./i.test(text) ||
    (explicitAmount !== null && explicitAmount < 0);
  const isExplicitCr =
    /\((?:cr)\)|\bcr\b|\bcr\./i.test(text) ||
    (explicitAmount !== null && explicitAmount > 0 && /\bcr\b/i.test(text));

  // 2. Comprehensive Credit / Inflow keywords (including Indian payroll 'sal', 'neft-cr', etc.)
  const creditKeywords =
    /\b(?:sal|salary|payroll|deposit|deposited|credit|credited|received|refund|refunded|interest|int\.pd|int pd|dividend|cashback|inward|neft-cr|imps-cr|rtgs-cr|ach-cr|upi-cr|reversal|bonus|gift|reimbursement|settlement|inflow)\b/i;

  // 3. Comprehensive Debit / Outflow keywords
  const debitKeywords =
    /\b(?:debit|debited|withdrawal|withdrawn|wdl|pos|ecom|charge|charges|fee|fees|tax|gst|paid|payment|bill|purchase|outward|transfer to|to transfer|outflow)\b/i;

  let type = "Debit";
  if (isExplicitCr) {
    type = "Credit";
  } else if (isExplicitDr) {
    type = "Debit";
  } else if (creditKeywords.test(lower)) {
    type = "Credit";
  } else if (debitKeywords.test(lower)) {
    type = "Debit";
  }

  // 4. Smart Category Inference
  let category = "Uncategorized";
  if (type === "Credit") {
    if (
      /\b(?:sal|salary|payroll|cognizant|tcs|infosys|wipro|accenture|hcl|tech mahindra|capgemini|amazon|google|microsoft)\b/i.test(
        lower
      ) &&
      !/\b(?:shopping|bill|purchase)\b/i.test(lower)
    ) {
      category = "Salary";
    } else if (/\b(?:interest|int\.pd|int pd)\b/i.test(lower)) {
      category = "Interest Income";
    } else if (/\bdividend\b/i.test(lower)) {
      category = "Dividend";
    } else if (/\brefund\b/i.test(lower)) {
      category = "Refund";
    } else if (/\bcashback\b/i.test(lower)) {
      category = "Investment Returns";
    } else {
      category = "Other Income";
    }
  } else {
    if (
      /\b(?:zomato|swiggy|dining|restaurant|cafe|starbucks|mcdonald|subway|pizza|burger|food|kfc|dominos)\b/i.test(
        lower
      ) &&
      !/\binstamart\b/i.test(lower)
    ) {
      category = "Dining";
    } else if (
      /\b(?:instamart|blinkit|zepto|grocery|groceries|supermarket|dmart|bigbasket|nature's basket|spencer|reliance fresh)\b/i.test(
        lower
      )
    ) {
      category = "Groceries";
    } else if (
      /\b(?:uber|ola|rapido|metro|fuel|petrol|diesel|fastag|irctc|redbus|flight|indigo|air india)\b/i.test(
        lower
      )
    ) {
      category = "Transportation";
    } else if (
      /\b(?:netflix|spotify|prime|hotstar|youtube|disney|cinema|movie|bookmyshow|pvr|inox)\b/i.test(
        lower
      )
    ) {
      category = "Entertainment";
    } else if (
      /\b(?:amazon|flipkart|myntra|ajio|shopping|zara|h&m|lifestyle|shoppers stop|meesho|nykaa)\b/i.test(
        lower
      )
    ) {
      category = "Shopping";
    } else if (
      /\b(?:electricity|water|broadband|wifi|airtel|jio|vi|vodafone|bescom|tneb|gas|cylinder|utility|utilities|billdesk)\b/i.test(
        lower
      )
    ) {
      category = "Utilities";
    } else if (
      /\b(?:pharmacy|apollo|medplus|pharmeasy|1mg|hospital|clinic|doctor|health|care|lab)\b/i.test(
        lower
      )
    ) {
      category = "Healthcare";
    } else if (
      /\b(?:school|college|university|coursera|udemy|education|tuition|fee|fees)\b/i.test(
        lower
      )
    ) {
      category = "Education";
    } else if (
      /\b(?:lic|insurance|hdfc life|icici pru|max life|star health|care insurance)\b/i.test(
        lower
      )
    ) {
      category = "Insurance";
    } else if (/\b(?:rent|maintenance|society|landlord|housing)\b/i.test(lower)) {
      category = "Rent";
    } else if (/\b(?:emi|loan|repayment|bajaj finserv|credit card debt)\b/i.test(lower)) {
      category = "EMI";
    } else {
      category = "Other Expense";
    }
  }

  return { type, category };
};

/**
 * Helper to clean up merchant names from common Indian & International statement narrations.
 *
 * @param {string} rawNarration
 * @returns {string}
 */
const extractCleanMerchant = (rawNarration) => {
  if (!rawNarration || typeof rawNarration !== "string") return "Unknown";
  let s = rawNarration.trim();
  if (s.length === 0) return "Unknown";

  // Strip leading row numbers and dates
  s = s.replace(/^\d+\s+/, "").replace(DATE_MASK_RE, "").trim();

  // Strip trailing amounts and running balance
  s = s.replace(STRICT_AMOUNT_PATTERN, "").trim();
  s = s.replace(/\s+\d+(?:,\d{2,3})*\.\d{2}.*$/, "").trim();

  // UPI pattern: UPI/REF/MERCHANT or UPI-REF-MERCHANT or UPI/MERCHANT/VPA
  const upiMatch = s.match(/UPI(?:\/|-)[^/\-\s]+(?:\/|-)([A-Za-z0-9\s._&-]+)(?:\/.*)?/i);
  if (upiMatch && upiMatch[1]) {
    let cand = upiMatch[1].replace(/@[a-zA-Z0-9]+$/, "").trim();
    cand = cand.replace(/\s+\d+.*$/, "").trim();
    if (cand.length > 1 && !/^\d+$/.test(cand)) {
      return cand.substring(0, 100);
    }
  }

  // POS / Card Swipe pattern
  const posMatch = s.match(/(?:POS|ECOM|SWIPE|CARD)\s+(?:\d+X+\d+\s+)?([A-Za-z0-9\s._&-]+)/i);
  if (posMatch && posMatch[1]) {
    let cand = posMatch[1]
      .split(/\s+(?:BANGALORE|MUMBAI|DELHI|HYDERABAD|CHENNAI|PUNE|KOLKATA|IN|IND)\b/i)[0]
      .trim();
    cand = cand.replace(/\s+\d+.*$/, "").trim();
    if (cand.length > 1) {
      return cand.substring(0, 100);
    }
  }

  // NEFT / RTGS / IMPS pattern
  const transferMatch = s.match(/(?:NEFT|RTGS|IMPS)(?:-|\/)[A-Za-z0-9]+(?:-|\/)([A-Za-z0-9\s._&-]+)/i);
  if (transferMatch && transferMatch[1]) {
    let cand = transferMatch[1].trim();
    cand = cand.split(/-(?:\s*[A-Z0-9\s]+-\d+)?/)[0].trim();
    const salSubMatch = cand.match(/^([A-Za-z0-9\s&._]+?)(?:\s+(?:Sal|Salary)\b.*)?$/i);
    if (salSubMatch && salSubMatch[1]) {
      return salSubMatch[1].trim().substring(0, 100);
    }
    return cand.substring(0, 100);
  }

  // ACH pattern
  const achMatch = s.match(/ACH\s+[A-Z]-\s*([A-Za-z0-9\s._&-]+)/i);
  if (achMatch && achMatch[1]) {
    let cand = achMatch[1].replace(/\s+\d+.*$/, "").trim();
    return cand.substring(0, 100);
  }

  // First line clean
  const firstLine = s.split("\n")[0].replace(/^\d+\s+/, "").trim();
  return firstLine.substring(0, 100) || "Unknown";
};

/**
 * Coordinate-aware 2D PDF Table Extractor.
 * Handles:
 * - Kotak Bank 6-7 column format with multi-dates (Txn Date + Value Date on same line).
 * - ICICI Bank format with separate Withdrawal (Dr) and Deposit (Cr) columns.
 * - Multi-line transaction narration without breaking blocks.
 * - Contextual row preservation (never drops legitimate repeated transactions).
 *
 * @param {Array} pages - Pages array from loadPDFStructuredDataWithPDFJS
 * @returns {Array} Extracted transaction objects
 */
const extractTransactionsFromStructuredPDF = (pages) => {
  const isDev = process.env.NODE_ENV !== "production";
  if (!pages || pages.length === 0) return [];

  // Match date at line start or after serial number (e.g. "1  02/09/2026" or "02/09/2026" or "102.09.2026")
  const ROW_START_DATE_RE = /(?:^|\s|\d{1,4})(?:(\d{4}[/\-.]\d{2}[/\-.]\d{2})|(\d{1,2}[/\-.](?:0[1-9]|1[0-2])[/\-.]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}))/i;

  const transactions = [];

  for (const page of pages) {
    const lines = page.lines || [];
    if (lines.length === 0) continue;

    // Detect if page contains table column headers
    let headerY = null;
    let isKotakLayout = false;
    let isICICILayout = false;
    let withdrawalColX = null;
    let depositColX = null;

    for (const line of lines) {
      const lower = line.text.toLowerCase();
      if (
        (lower.includes("transaction date") || lower.includes("txn date") || lower.includes("date")) &&
        (lower.includes("balance") ||
          lower.includes("debit") ||
          lower.includes("withdrawal") ||
          lower.includes("deposit") ||
          lower.includes("amount"))
      ) {
        headerY = line.y;

        if (lower.includes("value date") && (lower.includes("debit/credit") || lower.includes("chq / ref"))) {
          isKotakLayout = true;
        }

        if (lower.includes("withdrawal") && lower.includes("deposit")) {
          isICICILayout = true;
          // Identify X coordinates of Withdrawal vs Deposit header items
          for (const it of line.items) {
            const str = it.str.toLowerCase();
            if (str.includes("withdrawal") || str.includes("dr")) {
              withdrawalColX = it.x;
            }
            if (str.includes("deposit") || str.includes("cr")) {
              depositColX = it.x;
            }
          }
        }
        break;
      }
    }

    // Process table lines on this page
    const pageRows = [];
    let currentRow = null;

    for (const line of lines) {
      // Skip lines at or above the table header
      if (headerY !== null && line.y >= headerY - 2.0) {
        continue;
      }

      const text = line.text.trim();
      if (!text) continue;

      // Skip repeated page header / footer noise
      const lower = text.toLowerCase();
      if (
        lower.startsWith("page ") ||
        lower.includes("statement of account") ||
        lower.includes("generated on") ||
        lower.includes("opening balance") ||
        lower.includes("closing balance:") ||
        lower.includes("end of statement") ||
        lower.startsWith("total ")
      ) {
        continue;
      }

      // Check if line begins a new transaction row
      const firstItem = line.items[0];
      const hasDateMatch = text.match(ROW_START_DATE_RE);
      const isDateAtStart =
        hasDateMatch &&
        (!firstItem ||
          firstItem.x < 220 ||
          /^\d{1,4}$/.test(firstItem.str.trim()) ||
          /^\d{1,2}[/\-.]/.test(firstItem.str.trim()));

      if (isDateAtStart) {
        if (currentRow) {
          pageRows.push(currentRow);
        }
        currentRow = {
          startLine: line,
          lines: [line],
          dateRaw: hasDateMatch[1] || hasDateMatch[2] || hasDateMatch[3],
        };
      } else if (currentRow) {
        // Multi-line continuation for active transaction row
        currentRow.lines.push(line);
      }
    }

    if (currentRow) {
      pageRows.push(currentRow);
    }

    // Convert row units to normalized transactions
    for (const rowUnit of pageRows) {
      const allText = rowUnit.lines.map((l) => l.text).join(" ");
      const date = parseDate(rowUnit.dateRaw);
      if (!date) continue;

      // Mask dates before extracting amounts to avoid matching "31.07" from "31.07.2026"
      const textWithoutDates = allText.replace(DATE_MASK_RE, " __DATE__ ");
      const amountMatches = textWithoutDates.match(STRICT_AMOUNT_PATTERN) || [];
      const amounts = [];

      for (const m of amountMatches) {
        const lowerM = m.toLowerCase();
        const isExplicitDr = lowerM.includes("(dr)") || lowerM.endsWith("dr") || m.startsWith("-");
        const isExplicitCr = lowerM.includes("(cr)") || lowerM.endsWith("cr") || m.startsWith("+");
        const num = cleanAmount(m);
        if (num !== null && num > 0) {
          amounts.push({
            value: num,
            isExplicitDr,
            isExplicitCr,
            rawStr: m,
          });
        }
      }

      if (amounts.length === 0) continue;

      let txAmount = null;
      let txType = "Debit";

      // 1. Kotak Layout handling
      if (isKotakLayout) {
        const primaryAmt = amounts[0];
        txAmount = primaryAmt.value;
        if (primaryAmt.isExplicitCr) {
          txType = "Credit";
        } else if (primaryAmt.isExplicitDr) {
          txType = "Debit";
        } else {
          const detected = detectCategoryAndType(allText);
          txType = detected.type;
        }
      }
      // 2. ICICI Layout handling with separate Withdrawal vs Deposit columns
      else if (isICICILayout && withdrawalColX !== null && depositColX !== null) {
        let foundInWithdrawal = false;
        let foundInDeposit = false;

        for (const l of rowUnit.lines) {
          for (const it of l.items) {
            const num = cleanAmount(it.str);
            if (num !== null && num > 0) {
              const diffWithdrawal = Math.abs(it.x - withdrawalColX);
              const diffDeposit = Math.abs(it.x - depositColX);

              if (diffWithdrawal < diffDeposit && diffWithdrawal < 80) {
                foundInWithdrawal = true;
                txAmount = num;
                txType = "Debit";
                break;
              } else if (diffDeposit <= diffWithdrawal && diffDeposit < 80) {
                foundInDeposit = true;
                txAmount = num;
                txType = "Credit";
                break;
              }
            }
          }
          if (foundInWithdrawal || foundInDeposit) break;
        }

        if (!txAmount) {
          txAmount = amounts[0].value;
          txType = amounts[0].isExplicitCr ? "Credit" : "Debit";
        }
      }
      // 3. Standard / Generic Table handling
      else {
        const primaryAmt = amounts[0];
        txAmount = primaryAmt.value;
        if (primaryAmt.isExplicitCr) {
          txType = "Credit";
        } else if (primaryAmt.isExplicitDr) {
          txType = "Debit";
        } else {
          const detected = detectCategoryAndType(allText);
          txType = detected.type;
        }
      }

      if (!txAmount || isNaN(txAmount) || txAmount <= 0) continue;

      const detected = detectCategoryAndType(allText, txType === "Credit" ? txAmount : -txAmount);
      const merchant = extractCleanMerchant(allText);

      transactions.push({
        date,
        amount: txAmount,
        type: txType,
        category: detected.category,
        merchant,
        description: allText.substring(0, 255),
        originalDate: date,
        originalAmount: txAmount,
        originalType: txType,
        originalMerchant: merchant,
        originalDescription: allText.substring(0, 255),
      });
    }
  }

  if (isDev) {
    console.log(`[Structured PDF Parser] Extracted ${transactions.length} transactions across ${pages.length} pages`);
  }

  return transactions;
};

/**
 * Fallback Text-based Transaction Extractor.
 * Supports multi-date lines without premature block truncation.
 *
 * @param {string} text - Raw text from PDF
 * @returns {Array} Array of transactions
 */
const extractTransactionsFromText = (text) => {
  const isDev = process.env.NODE_ENV !== "production";

  // Matches a date anywhere in a line
  const DATE_ANYWHERE =
    /((?:19|20)\d{2}[/\-.]\d{2}[/\-.]\d{2}|(?:0[1-9]|[12]\d|3[01])[/\-.](?:0[1-9]|1[0-2])[/\-.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;

  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Identify line indices where a new transaction starts
  const dateLineIndices = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (DATE_ANYWHERE.test(line)) {
      dateLineIndices.push(i);
    }
  }

  if (dateLineIndices.length === 0) {
    return [];
  }

  // Build transaction blocks
  const blocks = [];
  for (let b = 0; b < dateLineIndices.length; b++) {
    const start = dateLineIndices[b];
    const end = b + 1 < dateLineIndices.length ? dateLineIndices[b + 1] : rawLines.length;
    blocks.push(rawLines.slice(start, end));
  }

  const transactions = [];

  for (const block of blocks) {
    const dateLine = block[0];

    // Extract first date from the line as transaction date
    const dateMatches = dateLine.match(DATE_ANYWHERE);
    if (!dateMatches) continue;

    const date = parseDate(dateMatches[1]);
    if (!date) continue;

    const fullNarration = block.join(" ");

    // Extract amounts from lines in block with dates masked
    const narrationWithoutDates = fullNarration.replace(DATE_MASK_RE, " __DATE__ ");
    STRICT_AMOUNT_PATTERN.lastIndex = 0;
    const amounts = [];
    let m;
    while ((m = STRICT_AMOUNT_PATTERN.exec(narrationWithoutDates)) !== null) {
      const n = cleanAmount(m[0]);
      if (n !== null && n > 0) amounts.push(n);
    }

    if (amounts.length === 0) continue;

    const txAmount = amounts[0];
    const detected = detectCategoryAndType(fullNarration);
    const merchant = extractCleanMerchant(fullNarration);

    transactions.push({
      date,
      amount: txAmount,
      type: detected.type,
      category: detected.category,
      merchant,
      description: fullNarration.substring(0, 255),
      originalDate: date,
      originalAmount: txAmount,
      originalType: detected.type,
      originalMerchant: merchant,
      originalDescription: fullNarration.substring(0, 255),
    });
  }

  if (isDev) {
    console.log(`[Text Parser Fallback] Extracted ${transactions.length} transactions`);
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
  if (
    typeof dateStr === "number" ||
    (!isNaN(Number(dateStr)) && Number(dateStr) > 25000 && Number(dateStr) < 75000)
  ) {
    const num = Number(dateStr);
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d;
  }

  const s = String(dateStr).trim();

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD — test before DD-MM-YYYY
  const iso = s.match(/^(\d{4})[/\-.](\d{2})[/\-.](\d{2})$/);
  if (iso) {
    const year = parseInt(iso[1]);
    const month = parseInt(iso[2]);
    const day = parseInt(iso[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY  (and 2-digit year variants)
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
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
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
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
    .replace(/[^0-9.-]/g, "") // strip any other non-numeric characters
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
  detectCategoryAndType,
  extractCleanMerchant,
  parseDate,
  parseAmount,
  normalizeRow,
};

