/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard and financial insights endpoints
 */

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview for the current month
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Returns all key financial figures calculated dynamically from
 *       Transactions, Loans, and Assets. Nothing is stored.
 *     responses:
 *       200:
 *         description: Dashboard overview
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalIncome:
 *                               type: number
 *                               example: 75000
 *                             totalExpenses:
 *                               type: number
 *                               example: 42000
 *                             netBalance:
 *                               type: number
 *                               example: 33000
 *                             netWorth:
 *                               type: object
 *                               properties:
 *                                 totalAssets:
 *                                   type: number
 *                                 totalLiabilities:
 *                                   type: number
 *                                 netWorth:
 *                                   type: number
 *                             activeLoans:
 *                               type: integer
 *                               example: 2
 *                             monthlyEmi:
 *                               type: number
 *                               example: 17356
 *                             recentTransactions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             topSpendingCategories:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     example: Food
 *                                   total:
 *                                     type: number
 *                                     example: 8500
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /dashboard/spending-analysis:
 *   get:
 *     summary: Get spending analysis for the current month
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Returns category breakdown, month-over-month category comparison,
 *       6-month spending trend, income vs expense summary, top merchants,
 *       and highest individual transactions.
 *     responses:
 *       200:
 *         description: Spending analysis
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         analysis:
 *                           type: object
 *                           properties:
 *                             byCategory:
 *                               type: array
 *                               description: Spending totals per category, current month
 *                             categoryComparison:
 *                               type: array
 *                               description: Category change vs previous month
 *                             monthlyTrend:
 *                               type: array
 *                               description: Monthly expense totals for last 6 months
 *                             incomeVsExpense:
 *                               type: object
 *                               properties:
 *                                 income:
 *                                   type: number
 *                                 expenses:
 *                                   type: number
 *                                 savings:
 *                                   type: number
 *                             topMerchants:
 *                               type: array
 *                             highestExpenses:
 *                               type: array
 *                             highestIncome:
 *                               type: array
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /dashboard/monthly-comparison:
 *   get:
 *     summary: Compare current month vs previous month
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly comparison
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         comparison:
 *                           type: object
 *                           properties:
 *                             currentMonth:
 *                               type: object
 *                               properties:
 *                                 label:
 *                                   type: string
 *                                   example: "August 2026"
 *                                 income:
 *                                   type: number
 *                                 expenses:
 *                                   type: number
 *                                 savings:
 *                                   type: number
 *                             previousMonth:
 *                               type: object
 *                             comparison:
 *                               type: object
 *                               properties:
 *                                 incomeDiff:
 *                                   type: number
 *                                 incomeChangePercent:
 *                                   type: integer
 *                                 expenseDiff:
 *                                   type: number
 *                                 expenseChangePercent:
 *                                   type: integer
 *                                 savingsDiff:
 *                                   type: number
 *                                 savingsChangePercent:
 *                                   type: integer
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /dashboard/health-score:
 *   get:
 *     summary: Get financial health score (0–100)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Dynamically calculates a financial health score.
 *       Score is never stored.
 *
 *       Weights: Savings Rate 40pt + Debt Ratio 30pt + Spending Habits 20pt + Income Stability 10pt.
 *
 *       Grades: 90–100 Excellent · 75–89 Good · 60–74 Fair · <60 Needs Improvement
 *     responses:
 *       200:
 *         description: Financial health score
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         healthScore:
 *                           type: object
 *                           properties:
 *                             score:
 *                               type: integer
 *                               example: 82
 *                             grade:
 *                               type: string
 *                               example: Good
 *                             breakdown:
 *                               type: object
 *                               properties:
 *                                 savingsRate:
 *                                   type: object
 *                                   properties:
 *                                     score:
 *                                       type: integer
 *                                     maxScore:
 *                                       type: integer
 *                                     value:
 *                                       type: string
 *                                 debtRatio:
 *                                   type: object
 *                                 spendingHabits:
 *                                   type: object
 *                                 incomeStability:
 *                                   type: object
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /dashboard/insights:
 *   get:
 *     summary: Get rule-based financial insights
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Generates natural-language insights from the user's financial data
 *       using a modular rule engine. No external AI service is used.
 *       The engine is designed so it can be replaced with an LLM in a future
 *       phase without changing this endpoint's contract.
 *     responses:
 *       200:
 *         description: Financial insights
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         insights:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example:
 *                             - "📈 Savings improved by 9% compared to last month."
 *                             - "🛒 Your highest spending category this month is Food (₹8,500)."
 *                             - "🟡 Loans currently represent 28% of your total assets."
 *                         count:
 *                           type: integer
 *                           example: 4
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
