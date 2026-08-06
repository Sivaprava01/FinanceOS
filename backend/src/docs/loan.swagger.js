/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Loan:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "664abc123def456"
 *         loanName:
 *           type: string
 *           example: "Home Loan - HDFC"
 *         loanType:
 *           type: string
 *           enum: [Home Loan, Car Loan, Personal Loan, Education Loan, Business Loan, Gold Loan, Other]
 *         lenderName:
 *           type: string
 *           example: "HDFC Bank"
 *         principalAmount:
 *           type: number
 *           example: 2000000
 *         interestRate:
 *           type: number
 *           example: 8.5
 *         loanStartDate:
 *           type: string
 *           format: date
 *           example: "2023-01-01"
 *         loanEndDate:
 *           type: string
 *           format: date
 *           example: "2043-01-01"
 *         emiAmount:
 *           type: number
 *           example: 17356
 *         emiDueDay:
 *           type: integer
 *           minimum: 1
 *           maximum: 31
 *           example: 5
 *         outstandingBalance:
 *           type: number
 *           example: 1850000
 *         loanStatus:
 *           type: string
 *           enum: [Active, Closed]
 *           example: "Active"
 *         totalMonths:
 *           type: integer
 *           example: 240
 *         emisPaid:
 *           type: integer
 *           example: 30
 *         emisRemaining:
 *           type: integer
 *           example: 210
 *         totalPaid:
 *           type: number
 *           example: 520680
 *         calculatedOutstandingBalance:
 *           type: number
 *           example: 1479320
 *         progressPercent:
 *           type: integer
 *           example: 12
 *         nextEmiDue:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-09-05"
 *         remainingTenure:
 *           type: string
 *           example: "17y 6m"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LoanSummary:
 *       type: object
 *       properties:
 *         totalActiveLoans:
 *           type: integer
 *           example: 3
 *         totalClosedLoans:
 *           type: integer
 *           example: 1
 *         totalOutstanding:
 *           type: number
 *           example: 3250000
 *         monthlyEmiTotal:
 *           type: number
 *           example: 52068
 */

/**
 * @swagger
 * /loans:
 *   post:
 *     summary: Create a new loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanName
 *               - loanType
 *               - lenderName
 *               - principalAmount
 *               - interestRate
 *               - loanStartDate
 *               - loanEndDate
 *               - emiAmount
 *               - emiDueDay
 *             properties:
 *               loanName:
 *                 type: string
 *                 example: "Home Loan - HDFC"
 *               loanType:
 *                 type: string
 *                 enum: [Home Loan, Car Loan, Personal Loan, Education Loan, Business Loan, Gold Loan, Other]
 *               lenderName:
 *                 type: string
 *                 example: "HDFC Bank"
 *               principalAmount:
 *                 type: number
 *                 example: 2000000
 *               interestRate:
 *                 type: number
 *                 example: 8.5
 *               loanStartDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-01"
 *               loanEndDate:
 *                 type: string
 *                 format: date
 *                 example: "2043-01-01"
 *               emiAmount:
 *                 type: number
 *                 example: 17356
 *               emiDueDay:
 *                 type: integer
 *                 example: 5
 *               outstandingBalance:
 *                 type: number
 *                 description: Defaults to principalAmount if omitted
 *                 example: 1850000
 *               loanStatus:
 *                 type: string
 *                 enum: [Active, Closed]
 *                 default: Active
 *     responses:
 *       201:
 *         description: Loan created successfully
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
 *                         loan:
 *                           $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   get:
 *     summary: Get all loans for the authenticated user
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Closed]
 *         description: Filter loans by status
 *     responses:
 *       200:
 *         description: List of loans with dynamic EMI tracking
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
 *                         loans:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /loans/summary:
 *   get:
 *     summary: Get aggregated loan summary for the authenticated user
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Returns dynamically calculated totals across all loans.
 *       Values are never stored — computed fresh on every request.
 *     responses:
 *       200:
 *         description: Loan summary
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
 *                         summary:
 *                           $ref: '#/components/schemas/LoanSummary'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /loans/{id}:
 *   get:
 *     summary: Get a single loan by ID
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB loan ID
 *     responses:
 *       200:
 *         description: Loan with dynamic EMI tracking
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
 *                         loan:
 *                           $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Loan belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Update a loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: All fields are optional — send only what needs updating
 *             properties:
 *               loanName:
 *                 type: string
 *               loanType:
 *                 type: string
 *                 enum: [Home Loan, Car Loan, Personal Loan, Education Loan, Business Loan, Gold Loan, Other]
 *               lenderName:
 *                 type: string
 *               principalAmount:
 *                 type: number
 *               interestRate:
 *                 type: number
 *               loanStartDate:
 *                 type: string
 *                 format: date
 *               loanEndDate:
 *                 type: string
 *                 format: date
 *               emiAmount:
 *                 type: number
 *               emiDueDay:
 *                 type: integer
 *               outstandingBalance:
 *                 type: number
 *               loanStatus:
 *                 type: string
 *                 enum: [Active, Closed]
 *     responses:
 *       200:
 *         description: Loan updated
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
 *                         loan:
 *                           $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Loan belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete a loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Loan belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
