/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and preferences management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FullUserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6649f1abc123"
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           example: jane@example.com
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/avatar.jpg"
 *         provider:
 *           type: string
 *           enum: [local, google]
 *         isEmailVerified:
 *           type: boolean
 *         country:
 *           type: string
 *           nullable: true
 *           example: "IN"
 *         preferredCurrency:
 *           type: string
 *           example: "USD"
 *         timeZone:
 *           type: string
 *           example: "Asia/Kolkata"
 *         preferences:
 *           type: object
 *           properties:
 *             language:
 *               type: string
 *               example: "en"
 *             theme:
 *               type: string
 *               enum: [light, dark, system]
 *               example: "system"
 *             notifications:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 push:
 *                   type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's full profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/FullUserProfile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Soft delete current user's account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Sets isDeleted = true on the user document.
 *       The MongoDB document is retained.
 *       All active sessions are immediately invalidated.
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 */

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Only name, avatar, country, preferredCurrency, and timeZone may be updated.
 *       Attempts to update email, password, or auth fields will be rejected.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/new-avatar.jpg"
 *               country:
 *                 type: string
 *                 example: "US"
 *                 description: ISO 3166-1 alpha-2 code
 *               preferredCurrency:
 *                 type: string
 *                 example: "EUR"
 *                 description: ISO 4217 currency code
 *               timeZone:
 *                 type: string
 *                 example: "Europe/London"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/FullUserProfile'
 *       400:
 *         description: Validation error or attempt to update a protected field
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
 */

/**
 * @swagger
 * /users/preferences:
 *   patch:
 *     summary: Update current user's preferences
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Merges the provided preference values with existing preferences.
 *       Sending only { theme: "dark" } will not overwrite language or notifications.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 example: "en"
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 example: "dark"
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/FullUserProfile'
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
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (admin only — not yet implemented)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     description: >
 *       Reserved for admin access. RBAC is not yet implemented.
 *       Returns 501 Not Implemented until admin roles are introduced.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       501:
 *         description: Not implemented
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
 */
