/**
 * Family Routes
 *
 * REST endpoints for family management, invitations, permissions, and dashboards.
 * All routes require JWT authentication.
 *
 * Endpoints:
 * - Family CRUD: POST, GET, PUT, DELETE
 * - Member management: GET, DELETE
 * - Invitations: POST, GET, PUT
 * - Sharing preferences: GET, PUT
 * - Family dashboard: GET
 */

import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import * as familyController from "../controllers/family.controller.js";

const router = express.Router();

// All family routes require authentication
router.use(verifyJWT);

// ─── Family Management ─────────────────────────────────────────────────────────

// Create family
router.post("/", familyController.createFamily);

// List user's families
router.get("/", familyController.listFamilies);

// Get family by ID
router.get("/:familyId", familyController.getFamily);

// Update family
router.put("/:familyId", familyController.updateFamily);

// Delete family
router.delete("/:familyId", familyController.deleteFamily);

// ─── Members ───────────────────────────────────────────────────────────────────

// List family members
router.get("/:familyId/members", familyController.listMembers);

// Remove member
router.delete("/:familyId/members/:memberId", familyController.removeMember);

// Leave family
router.post("/:familyId/leave", familyController.leaveFamily);

// ─── Invitations ───────────────────────────────────────────────────────────────

// Send invitation
router.post("/:familyId/invitations", familyController.sendInvitation);

// List pending invitations (for current user)
router.get("/invitations/pending", familyController.listInvitations);

// Accept invitation
router.post("/invitations/:invitationId/accept", familyController.acceptInvitation);

// Reject invitation
router.post("/invitations/:invitationId/reject", familyController.rejectInvitation);

// ─── Sharing Preferences ───────────────────────────────────────────────────────

// Get my sharing preferences in a family
router.get("/:familyId/sharing", familyController.getMySharing);

// Update my sharing preferences
router.put("/:familyId/sharing", familyController.updateSharing);

// Get another member's sharing preferences (for family head)
router.get("/:familyId/sharing/:userId", familyController.getSharing);

// ─── Family Dashboard ──────────────────────────────────────────────────────────

// Get family dashboard
router.get("/:familyId/dashboard", familyController.getFamilyDashboard);

export default router;
