/**
 * File Upload Middleware (Multer Configuration)
 *
 * Configures multer for handling file uploads.
 * Files are stored temporarily and should be cleaned up after processing.
 *
 * Privacy note: Files are NOT persisted permanently. After Phase 05
 * processes them (OCR + extraction), they MUST be deleted.
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ─── Directories ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory in project root (not in src/)
const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Storage Configuration ────────────────────────────────────────────────────

/**
 * Disk storage: saves files to the uploads directory with unique names.
 * Files are temporary and will be deleted after processing in Phase 05.
 *
 * Filename format: [userId]-[timestamp]-[random].ext
 * This ensures unique filenames and prevents collisions.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const userId = req.user?._id || "unknown";
    const ext = path.extname(file.originalname);

    const filename = `${userId}-${timestamp}-${random}${ext}`;
    cb(null, filename);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────

/**
 * Validates file type, extension, and mimetype.
 * Prevents arbitrary file uploads and NoSQL injection via filenames.
 */
const ALLOWED_MIMES = [
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".xls"];

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, CSV, XLSX`), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`), false);
  }

  // Check filename for suspicious patterns (prevent injection)
  if (!/^[\w\s\-\.]+$/.test(file.originalname)) {
    return cb(new Error("Filename contains invalid characters"), false);
  }

  cb(null, true);
};

// ─── Multer Instance ──────────────────────────────────────────────────────────

/**
 * Multer configuration for statement uploads.
 *
 * Security features:
 * - File size limit: 50MB (prevents DoS attacks)
 * - File type validation: only PDF, CSV, XLSX allowed
 * - File extension validation: prevents disguised files
 * - Filename sanitization: prevents path traversal and injection
 * - Single file only: max 1 file per request
 *
 * After upload:
 * - File is available as req.file
 * - req.file contains: originalname, filename, path, size, mimetype, etc.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1, // Only 1 file per request
  },
});

// ─── Export ────────────────────────────────────────────────────────────────────

export const uploadSingle = upload.single("statement");

export { uploadsDir };
