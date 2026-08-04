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
 * Current implementation: Simple pattern matching
 * Future: Can be replaced with more sophisticated parsing or OCR
 *
 * @param {string} text - Raw text from PDF
 * @returns {Array} Array of transactions
 */
const extractTransactionsFromText = (text) => {
  // For MVP: Return placeholder indicating manual review is needed
  // Real implementation would parse specific bank formats

  // Pattern to find date (DD/MM/YYYY or DD-MM-YYYY or similar)
  const datePattern = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
  const dates = text.match(datePattern) || [];

  if (dates.length === 0) {
    return [];
  }

  // Basic extraction: Group dates with nearby text as potential transactions
  const transactions = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const date = parseDate(dateMatch[0]);
      const amountMatch = line.match(/\d+(?:[.,]\d{2})?/);
      const amount = amountMatch ? parseAmount(amountMatch[0]) : null;

      if (date && amount) {
        transactions.push({
          date,
          amount: Math.abs(amount),
          type: amount > 0 ? "Credit" : "Debit",
          merchant: line.replace(datePattern, "").substring(0, 50).trim() || "Unknown",
          description: line,
          originalDate: date,
          originalAmount: Math.abs(amount),
          originalType: amount > 0 ? "Credit" : "Debit",
          originalMerchant: line.replace(datePattern, "").substring(0, 50).trim() || "Unknown",
          originalDescription: line,
        });
      }
    }
  }

  return transactions;
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Parses a date string in various formats.
 *
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {Date|null} Parsed Date object or null if invalid
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  // Try various date formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/,  // YYYY-MM-DD
    /(\d{2})[-\/](\d{2})[-\/](\d{4})/,  // DD-MM-YYYY or DD/MM/YYYY
    /(\d{2})[-\/](\d{2})[-\/](\d{2})/,  // DD-MM-YY or DD/MM/YY
  ];

  for (const format of formats) {
    const match = String(dateStr).match(format);
    if (match) {
      let year = parseInt(match[3]);
      let month = parseInt(match[2]);
      let day = parseInt(match[1]);

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
};

/**
 * Parses amount string into a number.
 *
 * @param {string|number} amountStr - Amount string or number
 * @returns {number|null} Parsed amount or null if invalid
 */
const parseAmount = (amountStr) => {
  if (!amountStr) return null;
  if (typeof amountStr === "number") return amountStr;

  const cleaned = String(amountStr).replace(/[^0-9.,\-]/g, "").replace(/,/g, ".");
  const amount = parseFloat(cleaned);

  return isNaN(amount) ? null : amount;
};

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
