/**
 * Integration Test for 4-Type Accounting Model & Dynamic Categories
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../src/db/index.js";
import User from "../src/models/user.model.js";
import Transaction from "../src/models/transaction.model.js";
import { categoryService } from "../src/services/category.service.js";
import { transactionService } from "../src/services/transaction.service.js";
import { dashboardService } from "../src/services/dashboard.service.js";

dotenv.config();

async function runTests() {
  console.log("🚀 Starting 4-Type Accounting Model Integration Tests...");
  await connectDB();

  let testUser = await User.findOne({ email: "accounting_test@financeos.com" });
  if (!testUser) {
    testUser = await User.create({
      name: "Accounting Tester",
      email: "accounting_test@financeos.com",
      passwordHash: "test_password_hash_placeholder",
      isEmailVerified: true,
    });
  }
  const userId = testUser._id.toString();

  // Clean up any old test transactions
  await Transaction.deleteMany({ user: userId });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ─── TEST 1: Default Categories Count & Filtering ─────────────────────────
  console.log("\n🧪 Test Suite 1: Default Categories Structure & Dynamic Filtering");
  const defaults = categoryService.getDefaultCategories();
  assert(defaults.length === 50, `Default categories total 50 (actual: ${defaults.length})`);

  const incomeCats = defaults.filter((c) => c.type === "income");
  assert(incomeCats.length === 11, `Income categories count is 11 (actual: ${incomeCats.length})`);
  assert(incomeCats.some((c) => c.name === "Salary"), "Income categories contain 'Salary'");

  const expenseCats = defaults.filter((c) => c.type === "expense");
  assert(expenseCats.length === 15, `Expense categories count is 15 (actual: ${expenseCats.length})`);
  assert(expenseCats.some((c) => c.name === "Groceries"), "Expense categories contain 'Groceries'");

  const assetCats = defaults.filter((c) => c.type === "asset");
  assert(assetCats.length === 13, `Asset categories count is 13 (actual: ${assetCats.length})`);
  assert(assetCats.some((c) => c.name === "Stocks"), "Asset categories contain 'Stocks'");

  const liabilityCats = defaults.filter((c) => c.type === "liability");
  assert(liabilityCats.length === 11, `Liability categories count is 11 (actual: ${liabilityCats.length})`);
  assert(liabilityCats.some((c) => c.name === "Home Loan"), "Liability categories contain 'Home Loan'");

  // ─── TEST 2: Create Expense with Payment Method ───────────────────────────
  console.log("\n🧪 Test Suite 2: Expense Creation & Payment Method Enforcement");
  const validExpense = await transactionService.createTransaction(userId, {
    date: new Date(),
    amount: 150.75,
    type: "expense",
    merchant: "Supermarket",
    category: "Groceries",
    paymentMethod: "credit_card",
  });
  assert(validExpense.type === "expense", "Expense transaction created with type 'expense'");
  assert(validExpense.paymentMethod === "credit_card", "Payment method stored as 'credit_card'");

  // Test missing payment method rejection for Expense
  let expenseError = null;
  try {
    await transactionService.createTransaction(userId, {
      date: new Date(),
      amount: 50.0,
      type: "expense",
      merchant: "Coffee Shop",
      category: "Dining",
      paymentMethod: "",
    });
  } catch (err) {
    expenseError = err;
  }
  assert(
    expenseError !== null && expenseError.message.includes("Payment method is required"),
    "Rejects expense transaction without payment method"
  );

  // ─── TEST 3: Create Income, Asset, Liability Transactions ─────────────────
  console.log("\n🧪 Test Suite 3: Income, Asset, Liability Creation & Payment Method Nullification");
  const validIncome = await transactionService.createTransaction(userId, {
    date: new Date(),
    amount: 5000.0,
    type: "income",
    merchant: "Acme Corp",
    category: "Salary",
    paymentMethod: "bank_transfer", // Should be sanitized to null
  });
  assert(validIncome.type === "income", "Income transaction created with type 'income'");
  assert(validIncome.paymentMethod === null, "Income transaction payment method sanitized to null");

  const validAsset = await transactionService.createTransaction(userId, {
    date: new Date(),
    amount: 2000.0,
    type: "asset",
    merchant: "Brokerage",
    category: "Stocks",
  });
  assert(validAsset.type === "asset", "Asset transaction created with type 'asset'");
  assert(validAsset.paymentMethod === null, "Asset transaction payment method is null");

  const validLiability = await transactionService.createTransaction(userId, {
    date: new Date(),
    amount: 10000.0,
    type: "liability",
    merchant: "Bank of America",
    category: "Personal Loan",
  });
  assert(validLiability.type === "liability", "Liability transaction created with type 'liability'");
  assert(validLiability.paymentMethod === null, "Liability transaction payment method is null");

  // ─── TEST 4: Category Type Mismatch Rejection ─────────────────────────────
  console.log("\n🧪 Test Suite 4: Category Type Matching Validation");
  let mismatchError = null;
  try {
    await transactionService.createTransaction(userId, {
      date: new Date(),
      amount: 100.0,
      type: "income",
      merchant: "Client X",
      category: "Groceries", // Groceries belongs to expense, not income!
    });
  } catch (err) {
    mismatchError = err;
  }
  assert(
    mismatchError !== null && mismatchError.message.includes("belongs to type"),
    "Rejects category-type mismatch (Income + Groceries)"
  );

  // ─── TEST 5: Update Transaction Flow ──────────────────────────────────────
  console.log("\n🧪 Test Suite 5: Update Transaction Flow");
  // Update validExpense to Asset type -> should clear paymentMethod to null
  const updatedToAsset = await transactionService.updateTransaction(
    validExpense._id,
    userId,
    {
      type: "asset",
      category: "Cash",
    }
  );
  assert(updatedToAsset.type === "asset", "Updated transaction type to 'asset'");
  assert(updatedToAsset.paymentMethod === null, "Cleared payment method when updated to asset");

  // ─── TEST 6: Transaction Statistics & Dashboard Aggregations ──────────────
  console.log("\n🧪 Test Suite 6: Transaction Statistics & Dashboard Aggregations");
  const stats = await transactionService.getTransactionStats(userId);
  assert(stats.summary.totalIncome === 5000, `Stats summary totalIncome is 5000 (actual: ${stats.summary.totalIncome})`);
  assert(stats.summary.totalAsset === 2150.75, `Stats summary totalAsset is 2150.75 (actual: ${stats.summary.totalAsset})`);
  assert(stats.summary.totalLiability === 10000, `Stats summary totalLiability is 10000 (actual: ${stats.summary.totalLiability})`);

  const overview = await dashboardService.getOverview(userId);
  assert(overview.totalIncome === 5000, `Dashboard overview totalIncome is 5000 (actual: ${overview.totalIncome})`);

  // Clean up
  await Transaction.deleteMany({ user: userId });
  await User.deleteOne({ _id: userId });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
