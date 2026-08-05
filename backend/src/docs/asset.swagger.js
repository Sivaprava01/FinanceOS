/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management and Net Worth endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "664abc123def789"
 *         assetName:
 *           type: string
 *           example: "HDFC Savings Account"
 *         assetCategory:
 *           type: string
 *           enum: [Cash, Bank Account, Gold, Real Estate, Vehicle, Stocks, Mutual Funds, Cryptocurrency, Others]
 *         currentValue:
 *           type: number
 *           example: 250000
 *         purchaseValue:
 *           type: number
 *           nullable: true
 *           example: 200000
 *         purchaseDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2022-06-15"
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Joint account with spouse"
 *         gainLoss:
 *           type: number
 *           nullable: true
 *           description: currentValue minus purchaseValue (null when purchaseValue not set)
 *           example: 50000
 *         gainLossPercent:
 *           type: number
 *           nullable: true
 *           description: Percentage gain or loss relative to purchaseValue
 *           example: 25.0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AssetSummary:
 *       type: object
 *       properties:
 *         totalAssets:
 *           type: integer
 *           example: 5
 *         totalValue:
 *           type: number
 *           example: 1500000
 *         byCategory:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           example:
 *             Bank Account: 250000
 *             Real Estate: 1000000
 *             Gold: 250000
 *     NetWorth:
 *       type: object
 *       properties:
 *         totalAssets:
 *           type: number
 *           example: 1500000
 *         totalLiabilities:
 *           type: number
 *           description: Sum of outstandingBalance across all active loans
 *           example: 400000
 *         netWorth:
 *           type: number
 *           description: totalAssets minus totalLiabilities
 *           example: 1100000
 *         assetCount:
 *           type: integer
 *           example: 5
 *         activeLoanCount:
 *           type: integer
 *           example: 2
 *         assetBreakdown:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           example:
 *             Bank Account: 250000
 *             Real Estate: 1000000
 *             Gold: 250000
 */

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create a new asset
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetName, assetCategory, currentValue]
 *             properties:
 *               assetName:
 *                 type: string
 *                 example: "HDFC Savings Account"
 *               assetCategory:
 *                 type: string
 *                 enum: [Cash, Bank Account, Gold, Real Estate, Vehicle, Stocks, Mutual Funds, Cryptocurrency, Others]
 *               currentValue:
 *                 type: number
 *                 example: 250000
 *               purchaseValue:
 *                 type: number
 *                 nullable: true
 *                 example: 200000
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2022-06-15"
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Asset created
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
 *                         asset:
 *                           $ref: '#/components/schemas/Asset'
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
 *     summary: Get all assets for the authenticated user
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Cash, Bank Account, Gold, Real Estate, Vehicle, Stocks, Mutual Funds, Cryptocurrency, Others]
 *         description: Filter by asset category
 *     responses:
 *       200:
 *         description: List of assets
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
 *                         assets:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /assets/summary:
 *   get:
 *     summary: Get asset totals and category breakdown
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Asset summary
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
 *                           $ref: '#/components/schemas/AssetSummary'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /assets/net-worth:
 *   get:
 *     summary: Calculate net worth (total assets minus active loan liabilities)
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Net Worth = sum(asset.currentValue) - sum(activeLoan.outstandingBalance).
 *       Only loans with status "Active" are counted as liabilities.
 *       Closed loans are settled debts and excluded.
 *       All values are computed fresh on every request — nothing is stored.
 *     responses:
 *       200:
 *         description: Net worth breakdown
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
 *                         netWorth:
 *                           $ref: '#/components/schemas/NetWorth'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get a single asset by ID
 *     tags: [Assets]
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
 *         description: Asset
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
 *                         asset:
 *                           $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Asset belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Update an asset
 *     tags: [Assets]
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
 *             description: All fields optional — send only what needs updating
 *             properties:
 *               assetName:
 *                 type: string
 *               assetCategory:
 *                 type: string
 *                 enum: [Cash, Bank Account, Gold, Real Estate, Vehicle, Stocks, Mutual Funds, Cryptocurrency, Others]
 *               currentValue:
 *                 type: number
 *               purchaseValue:
 *                 type: number
 *                 nullable: true
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Asset updated
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
 *                         asset:
 *                           $ref: '#/components/schemas/Asset'
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
 *         description: Asset belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete an asset
 *     tags: [Assets]
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
 *         description: Asset deleted
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
 *         description: Asset belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
