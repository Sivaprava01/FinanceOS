import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const buffer = fs.readFileSync("./tests/test-statement.pdf");
const data   = await pdfParse(buffer);
const text   = data.text;

// Fixed regex from parser.service.js
const DATE_ANYWHERE = /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}|(?:0[1-9]|[12]\d|3[01])[\/\-\.](?:0[1-9]|1[0-2])[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;
const AMOUNT_RE     = /\d{1,3}(?:,\d{2,3})*\.\d{2}/g;

const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

console.log("=== FIXED DATE_ANYWHERE matches ===\n");
for (let i = 0; i < rawLines.length; i++) {
  const m = rawLines[i].match(DATE_ANYWHERE);
  if (m) {
    console.log(`L${String(i).padStart(3,"0")}: token="${m[1]}"  line="${rawLines[i]}"`);
  }
}

// Build blocks with fixed regex and show first 3 with amounts
const dateLineIndices = [];
for (let i = 0; i < rawLines.length; i++) {
  if (DATE_ANYWHERE.test(rawLines[i])) dateLineIndices.push(i);
}

const blocks = [];
for (let b = 0; b < dateLineIndices.length; b++) {
  const start = dateLineIndices[b];
  const end   = b + 1 < dateLineIndices.length ? dateLineIndices[b + 1] : rawLines.length;
  blocks.push(rawLines.slice(start, end));
}

console.log("\n=== FIRST 5 BLOCKS — date token + amounts from slice(1) ===\n");
for (let b = 0; b < Math.min(5, blocks.length); b++) {
  const block = blocks[b];
  const dateM = block[0].match(DATE_ANYWHERE);
  const amountText = block.slice(1).join(" ");
  AMOUNT_RE.lastIndex = 0;
  const amounts = [];
  let m;
  while ((m = AMOUNT_RE.exec(amountText)) !== null) amounts.push(m[0]);

  console.log(`Block ${b+1}: date_line="${block[0]}" token="${dateM ? dateM[1] : "NONE"}"`);
  console.log(`  merchant="${block[1] || "?"}" | amounts_line="${block[block.length-1]}"`);
  console.log(`  amounts found in slice(1): [${amounts.join(", ")}]`);
  console.log();
}
