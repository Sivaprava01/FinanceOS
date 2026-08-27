/**
 * Transaction Type Migration Script
 *
 * Migrates legacy banking transaction types (Debit/Credit) to accounting types (income/expense).
 * Preserves original banking terms in `bankingType` field for backwards compatibility.
 * Sets `paymentMethod: null` for historical records so they continue to pass validation.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./index.js";
import Transaction from "../models/transaction.model.js";

dotenv.config();

const migrateTransactionTypes = async () => {
  try {
    console.log("🔄 Connecting to database for transaction migration...");
    await connectDB();

    console.log("🔍 Scanning for legacy transactions to migrate...");

    // Find transactions with Debit/Credit or missing lowercase types
    const legacyTransactions = await Transaction.find({
      $or: [
        { type: { $in: ["Debit", "Credit", "Debit", "Credit"] } },
        { bankingType: { $exists: false } },
        { paymentMethod: { $exists: false } },
      ],
    });

    console.log(`Found ${legacyTransactions.length} transaction(s) requiring migration/update.`);

    let updatedCount = 0;
    for (const tx of legacyTransactions) {
      let changed = false;
      const currentType = tx.type;

      if (currentType === "Debit") {
        tx.type = "expense";
        tx.bankingType = "Debit";
        changed = true;
      } else if (currentType === "Credit") {
        tx.type = "income";
        tx.bankingType = "Credit";
        changed = true;
      } else if (["income", "expense", "asset", "liability"].includes(currentType?.toLowerCase())) {
        tx.type = currentType.toLowerCase();
        changed = true;
      }

      if (tx.paymentMethod === undefined) {
        tx.paymentMethod = null;
        changed = true;
      }

      if (changed) {
        await tx.save();
        updatedCount++;
      }
    }

    console.log(`✅ Successfully migrated ${updatedCount} transaction(s) to the new accounting model.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateTransactionTypes();
