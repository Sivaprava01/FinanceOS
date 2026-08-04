/**
 * Verification — runs the FIXED parser against the real PDF.
 * Prints total parsed, first 5 transactions, rejected lines.
 */

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const PDF_PATH = "./tests/test-statement.pdf";
const buffer   = fs.readFileSync(PDF_PATH);
const data     = await pdfParse(buffer);
const text     = data.text || "";

// ── Paste fixed helpers inline so we don't need to load the full service ──────

const parseDate = (s) => {
  s = String(s).trim();
  const iso = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
    if (!isNaN(d.getTime())) return d;
  }
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    let year = parseInt(dmy[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
    if (!isNaN(d.getTime())) return d;
  }
  const dMonthY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (dMonthY) {
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const monthIdx = months[dMonthY[2].toLowerCase()];
    if (monthIdx === undefined) return null;
    let year = parseInt(dMonthY[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, monthIdx, parseInt(dMonthY[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const cleanAmount = (str) => {
  const cleaned = String(str).replace(/,/g, "").replace(/[^0-9.\-]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

const DATE_ANYWHERE = /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;
const AMOUNT_RE     = /\d{1,3}(?:,\d{2,3})*\.\d{2}/g;

const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

// Build date-line index
const dateLineIndices = [];
for (let i = 0; i < rawLines.length; i++) {
  if (DATE_ANYWHERE.test(rawLines[i])) dateLineIndices.push(i);
}

// Build blocks
const blocks = [];
for (let b = 0; b < dateLineIndices.length; b++) {
  const start = dateLineIndices[b];
  const end   = b + 1 < dateLineIndices.length ? dateLineIndices[b + 1] : rawLines.length;
  blocks.push(rawLines.slice(start, end));
}

// Parse blocks
const transactions = [];
const rejected     = [];
const creditKW     = /\bdeposit\b|credit|salary|received|refund|interest|cashback|\binward\b|\bCr\b/i;

for (const block of blocks) {
  const dateLine       = block[0];
  const dateTokenMatch = dateLine.match(DATE_ANYWHERE);
  if (!dateTokenMatch) { rejected.push({ reason: "no date token", line: dateLine }); continue; }

  const date = parseDate(dateTokenMatch[1]);
  if (!date) { rejected.push({ reason: `unparseable: "${dateTokenMatch[1]}"`, line: dateLine }); continue; }

  const merchant      = block.length > 1 ? block[1].substring(0, 100) : "Unknown";
  const fullNarration = block.join(" ");

  AMOUNT_RE.lastIndex = 0;
  const amounts = [];
  let m;
  while ((m = AMOUNT_RE.exec(fullNarration)) !== null) {
    const n = cleanAmount(m[0]);
    if (n !== null) amounts.push(n);
  }

  if (amounts.length === 0) { rejected.push({ reason: "no amount", line: dateLine }); continue; }

  const isCredit = creditKW.test(fullNarration);
  const txAmount = amounts[0];

  transactions.push({
    date: date.toISOString().slice(0, 10),
    amount: txAmount,
    type: isCredit ? "Credit" : "Debit",
    merchant,
  });
}

// ── Print results ─────────────────────────────────────────────────────────────
const SEP = "=".repeat(72);

console.log(SEP);
console.log(`FIXED PARSER RESULT — real PDF: ${PDF_PATH}`);
console.log(SEP);
console.log(`Total transactions parsed : ${transactions.length}`);
console.log(`Total blocks rejected     : ${rejected.length}`);
console.log(`PDF pages                 : ${data.numpages}`);
console.log(`Characters extracted      : ${text.length}`);

console.log(`\nFirst 5 transactions:`);
transactions.slice(0, 5).forEach((t, i) => {
  console.log(`  [${i + 1}] date=${t.date}  type=${t.type.padEnd(6)}  amount=${String(t.amount).padStart(10)}  merchant="${t.merchant}"`);
});

if (rejected.length > 0) {
  console.log(`\nRejected blocks (${rejected.length}):`);
  rejected.forEach((r, i) => {
    console.log(`  [${i + 1}] reason="${r.reason}" | line="${r.line.slice(0, 80)}"`);
  });
} else {
  console.log(`\nNo rejected blocks.`);
}

console.log(`\n${transactions.length > 0 ? "✅ Original error resolved — transactions found." : "❌ Still returning zero transactions."}`);
