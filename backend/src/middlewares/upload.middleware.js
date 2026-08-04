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
 * Accepts only supported file types (PDF, CSV, XLSX).
 * Validation rules are checked again in the validation middleware,
 * but we filter here too as a first line of defense.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"), false);
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────

/**
 * Multer configuration for statement uploads.
 *
 * Limits:
 * - maxFileSize: 50MB (reasonable for bank statements)
 * - maxFiles: 1 (single file per request)
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
  },
});

// ─── Export ────────────────────────────────────────────────────────────────────

export const uploadSingle = upload.single("statement");

export { uploadsDir };
