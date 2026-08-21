/**
 * Family Controller
 *
 * Thin layer between family routes and family service.
 * Responsibilities:
 * - Receive request
 * - Validate inputs
 * - Call service methods
 * - Return ApiResponse
 * - Throw ApiError when required
 *
 * All business logic is in family.service.js
 */

import { familyService } from "../services/family.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import {
  validateCreateFamily,
  validateUpdateFamily,
  validateSendInvitation,
  validateUpdateSharing,
  validateObjectId,
} from "../validations/family.validation.js";
import { HTTP_STATUS, FAMILY_MESSAGES } from "../constants/index.js";

// ─── Family Management ─────────────────────────────────────────────────────────

export const createFamily = asyncHandler(async (req, res) => {
  validateCreateFamily(req);

  const family = await familyService.createFamily(req.user._id, req.body);

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, FAMILY_MESSAGES.FAMILY_CREATED, { family }));
});

export const getFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  const family = await familyService.getFamily(familyId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.FAMILY_FETCHED, { family }));
});

export const listFamilies = asyncHandler(async (req, res) => {
  const families = await familyService.listFamilies(req.user._id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.FAMILY_LIST_FETCHED, {
      families,
      count: families.length,
    })
  );
});

export const updateFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");
  validateUpdateFamily(req);

  const family = await familyService.updateFamily(familyId, req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.FAMILY_UPDATED, { family }));
});

export const deleteFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  await familyService.deleteFamily(familyId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.FAMILY_DELETED));
});

// ─── Invitations ───────────────────────────────────────────────────────────────

export const sendInvitation = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");
  validateSendInvitation(req);

  const invitation = await familyService.sendInvitation(
    familyId,
    req.user._id,
    req.body.invitedEmail
  );

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, FAMILY_MESSAGES.INVITATION_SENT, { invitation }));
});

export const listInvitations = asyncHandler(async (req, res) => {
  const invitations = await familyService.listInvitations(req.user._id, req.user.email);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.INVITATIONS_FETCHED, {
      invitations,
      count: invitations.length,
    })
  );
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { invitationId } = req.params;
  validateObjectId(invitationId, "Invitation ID");

  const result = await familyService.acceptInvitation(invitationId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.INVITATION_ACCEPTED, result));
});

export const rejectInvitation = asyncHandler(async (req, res) => {
  const { invitationId } = req.params;
  validateObjectId(invitationId, "Invitation ID");

  const result = await familyService.rejectInvitation(invitationId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.INVITATION_REJECTED, result));
});

// ─── Member Management ─────────────────────────────────────────────────────────

export const removeMember = asyncHandler(async (req, res) => {
  const { familyId, memberId } = req.params;
  validateObjectId(familyId, "Family ID");
  validateObjectId(memberId, "Member ID");

  await familyService.removeMember(familyId, req.user._id, memberId);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.MEMBER_REMOVED));
});

export const leaveFamily = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  await familyService.leaveFamily(familyId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "You have left the family successfully"));
});

export const listMembers = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  const members = await familyService.listMembers(familyId, req.user._id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.MEMBER_LIST_FETCHED, {
      members,
      count: members.length,
    })
  );
});

// ─── Sharing Preferences ───────────────────────────────────────────────────────

export const updateSharing = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");
  validateUpdateSharing(req);

  const sharing = await familyService.updateSharing(familyId, req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.SHARING_UPDATED, { sharing }));
});

export const getSharing = asyncHandler(async (req, res) => {
  const { familyId, userId } = req.params;
  validateObjectId(familyId, "Family ID");
  validateObjectId(userId, "User ID");

  const sharing = await familyService.getSharing(familyId, userId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.SHARING_FETCHED, { sharing }));
});

export const getMySharing = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  const sharing = await familyService.getSharing(familyId, req.user._id, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.SHARING_FETCHED, { sharing }));
});

// ─── Family Dashboard ──────────────────────────────────────────────────────────

export const getFamilyDashboard = asyncHandler(async (req, res) => {
  const { familyId } = req.params;
  validateObjectId(familyId, "Family ID");

  const dashboard = await familyService.getFamilyDashboard(familyId, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, FAMILY_MESSAGES.FAMILY_DASHBOARD_FETCHED, { dashboard }));
});
