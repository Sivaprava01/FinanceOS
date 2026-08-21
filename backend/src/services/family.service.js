/**
 * Family Service
 *
 * Business logic for family management, invitations, permissions, and dashboards.
 * All authorization checks happen here before database operations.
 *
 * Core responsibilities:
 * - Family CRUD (create, update, delete, list)
 * - Member management (add, remove, list)
 * - Invitation handling (send, accept, reject, list)
 * - Sharing preferences (get, update)
 * - Family dashboard calculations
 */

import mongoose from "mongoose";
import Family from "../models/family.model.js";
import FamilyInvitation from "../models/family-invitation.model.js";
import FamilySharing from "../models/family-sharing.model.js";
import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";
import Asset from "../models/asset.model.js";
import Loan from "../models/loan.model.js";
import ApiError from "../utils/ApiError.js";
import {
  HTTP_STATUS,
  FAMILY_ROLES,
  INVITATION_STATUS,
  FAMILY_MESSAGES,
  LOAN_STATUS,
} from "../constants/index.js";

const { Types } = mongoose;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rounds a number to 2 decimal places */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Checks if user is family head
 * Works with both populated documents and ObjectIds
 * @private
 */
const isHead = (family, userId) => {
  // If familyHead is populated (document with _id), use _id; otherwise use direct comparison
  const headId = family.familyHead._id || family.familyHead;
  return headId.toString() === userId.toString();
};

/**
 * Checks if user is a member of the family
 * Works with both populated documents and ObjectIds
 * @private
 */
const isMember = (family, userId) => {
  return family.members.some((m) => {
    // If user is populated (document with _id), use _id; otherwise use direct comparison
    const memberId = m.user._id || m.user;
    return memberId.toString() === userId.toString();
  });
};

/**
 * Checks if user is head or member
 * @private
 */
const hasAccess = (family, userId) => {
  return isHead(family, userId) || isMember(family, userId);
};

/**
 * Gets sharing preferences for a user in a family
 * Returns default (all false) if preferences not found
 * @private
 */
const getSharing = async (familyId, userId) => {
  let sharing = await FamilySharing.findOne({
    family: familyId,
    user: userId,
  });

  if (!sharing) {
    sharing = new FamilySharing({
      family: familyId,
      user: userId,
      shareTransactions: false,
      shareAssets: false,
      shareLoans: false,
      shareNetWorth: false,
      shareEverything: false,
    });
  }

  return sharing;
};

// ─── Family Management ────────────────────────────────────────────────────────

/**
 * Create a new family
 * User becomes the family head automatically
 *
 * @param {string} userId
 * @param {object} data - { familyName, description }
 * @returns {Promise<object>}
 */
const createFamily = async (userId, data) => {
  const { familyName, description } = data;

  const family = await Family.create({
    familyHead: userId,
    familyName,
    description: description || null,
    members: [
      {
        user: userId,
        role: FAMILY_ROLES.HEAD,
        joinedAt: new Date(),
      },
    ],
  });

  // Create sharing preferences for head (all disabled by default)
  await FamilySharing.create({
    family: family._id,
    user: userId,
    shareTransactions: false,
    shareAssets: false,
    shareLoans: false,
    shareNetWorth: false,
    shareEverything: false,
  });

  return family.toObject();
};

/**
 * Get family by ID
 * User must be head or member
 *
 * @param {string} familyId
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getFamily = async (familyId, userId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  })
    .populate("familyHead", "name email avatar")
    .populate("members.user", "name email avatar");

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  return family.toObject();
};

/**
 * List all families the user is part of
 * Returns families where user is head or member
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const listFamilies = async (userId) => {
  const families = await Family.find({
    $or: [{ familyHead: userId }, { "members.user": userId }],
    isDeleted: false,
  })
    .populate("familyHead", "name email avatar")
    .populate("members.user", "name email avatar")
    .sort({ createdAt: -1 });

  return families.map((f) => f.toObject());
};

/**
 * Update family
 * Only family head can update
 *
 * @param {string} familyId
 * @param {string} userId
 * @param {object} data - { familyName, description }
 * @returns {Promise<object>}
 */
const updateFamily = async (familyId, userId, data) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!isHead(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  const updated = await Family.findByIdAndUpdate(familyId, { $set: data }, { new: true })
    .populate("familyHead", "name email avatar")
    .populate("members.user", "name email avatar");

  return updated.toObject();
};

/**
 * Delete family (soft delete)
 * Only family head can delete
 *
 * @param {string} familyId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteFamily = async (familyId, userId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!isHead(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  await Family.findByIdAndUpdate(familyId, { isDeleted: true });
};

// ─── Invitations ─────────────────────────────────────────────────────────────

/**
 * Send invitation to join family
 * Only family head can send invitations
 *
 * @param {string} familyId
 * @param {string} userId - who is sending
 * @param {string} invitedEmail - email of person being invited
 * @returns {Promise<object>}
 */
const sendInvitation = async (familyId, userId, invitedEmail) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!isHead(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  // Check if email is already a member
  const user = await User.findOne({ email: invitedEmail, isDeleted: false });
  if (user && isMember(family, user._id)) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.ALREADY_MEMBER);
  }

  // Check for existing pending invitation
  const existing = await FamilyInvitation.findOne({
    family: familyId,
    invitedEmail: invitedEmail.toLowerCase(),
    status: INVITATION_STATUS.PENDING,
  });

  if (existing && existing.expiresAt > new Date()) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "An active invitation already exists for this email");
  }

  // Create invitation with 7-day expiry
  const invitation = await FamilyInvitation.create({
    family: familyId,
    invitedBy: userId,
    invitedEmail: invitedEmail.toLowerCase(),
    status: INVITATION_STATUS.PENDING,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return invitation.toObject();
};

/**
 * Get pending invitations for current user
 * Returns invitations sent to user's email
 *
 * @param {string} userId
 * @param {string} userEmail
 * @returns {Promise<Array>}
 */
const listInvitations = async (userId, userEmail) => {
  const invitations = await FamilyInvitation.find({
    invitedEmail: userEmail.toLowerCase(),
    status: INVITATION_STATUS.PENDING,
    expiresAt: { $gt: new Date() },
  })
    .populate("family", "familyName description")
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });

  return invitations.map((i) => i.toObject());
};

/**
 * Accept invitation to join family
 *
 * @param {string} invitationId
 * @param {string} userId
 * @returns {Promise<object>}
 */
const acceptInvitation = async (invitationId, userId) => {
  const invitation = await FamilyInvitation.findById(invitationId);

  if (!invitation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.INVITATION_NOT_FOUND);
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.INVALID_INVITATION);
  }

  if (invitation.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.INVITATION_EXPIRED);
  }

  const family = await Family.findOne({
    _id: invitation.family,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  // Check if already a member
  if (isMember(family, userId)) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.ALREADY_MEMBER);
  }

  // Add user as member
  family.members.push({
    user: userId,
    role: FAMILY_ROLES.MEMBER,
    joinedAt: new Date(),
  });

  await family.save();

  // Create sharing preferences for new member
  await FamilySharing.create({
    family: invitation.family,
    user: userId,
    shareTransactions: false,
    shareAssets: false,
    shareLoans: false,
    shareNetWorth: false,
    shareEverything: false,
  });

  // Update invitation
  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.respondedAt = new Date();
  invitation.respondedBy = userId;
  await invitation.save();

  return { success: true, message: "Invitation accepted" };
};

/**
 * Reject invitation
 *
 * @param {string} invitationId
 * @param {string} userId
 * @returns {Promise<object>}
 */
const rejectInvitation = async (invitationId, userId) => {
  const invitation = await FamilyInvitation.findById(invitationId);

  if (!invitation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.INVITATION_NOT_FOUND);
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.INVALID_INVITATION);
  }

  invitation.status = INVITATION_STATUS.REJECTED;
  invitation.respondedAt = new Date();
  invitation.respondedBy = userId;
  await invitation.save();

  return { success: true, message: "Invitation rejected" };
};

// ─── Member Management ────────────────────────────────────────────────────────

/**
 * Remove member from family
 * Only family head can remove members
 * Family head cannot be removed
 *
 * @param {string} familyId
 * @param {string} headId - who is performing the action
 * @param {string} memberId - who to remove
 * @returns {Promise<void>}
 */
const removeMember = async (familyId, headId, memberId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!isHead(family, headId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  // Cannot remove family head
  if (memberId === family.familyHead.toString()) {
    throw new ApiError(HTTP_STATUS.CONFLICT, FAMILY_MESSAGES.CANNOT_REMOVE_HEAD);
  }

  const memberExists = isMember(family, memberId);
  if (!memberExists) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.MEMBER_NOT_FOUND);
  }

  // Remove from members array
  family.members = family.members.filter((m) => m.user.toString() !== memberId.toString());

  await family.save();

  // Delete sharing preferences
  await FamilySharing.deleteOne({
    family: familyId,
    user: memberId,
  });
};

/**
 * Leave family
 * User removes themselves from family (except head)
 *
 * @param {string} familyId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const leaveFamily = async (familyId, userId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  if (isHead(family, userId)) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Family head cannot leave the family");
  }

  // Remove from members array
  family.members = family.members.filter((m) => m.user.toString() !== userId.toString());

  await family.save();

  // Delete sharing preferences
  await FamilySharing.deleteOne({
    family: familyId,
    user: userId,
  });
};

/**
 * List family members
 * Only head and members can list members
 *
 * @param {string} familyId
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const listMembers = async (familyId, userId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  }).populate("members.user", "name email avatar");

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  return family.members.map((m) => ({
    _id: m._id,
    user: m.user,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
};

// ─── Sharing Preferences ──────────────────────────────────────────────────────

/**
 * Update sharing preferences for user
 * User can only update their own preferences
 *
 * @param {string} familyId
 * @param {string} userId
 * @param {object} data - sharing preference updates
 * @returns {Promise<object>}
 */
const updateSharing = async (familyId, userId, data) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  let sharing = await FamilySharing.findOne({
    family: familyId,
    user: userId,
  });

  if (!sharing) {
    sharing = new FamilySharing({
      family: familyId,
      user: userId,
    });
  }

  // Update only provided fields
  Object.assign(sharing, data);
  await sharing.save();

  return sharing.toObject();
};

/**
 * Get sharing preferences for a specific user in a family
 *
 * @param {string} familyId
 * @param {string} userId
 * @param {string} requestingUserId
 * @returns {Promise<object>}
 */
const getSharingPreferences = async (familyId, userId, requestingUserId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, requestingUserId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  const sharing = await FamilySharing.findOne({
    family: familyId,
    user: userId,
  });

  if (!sharing) {
    return {
      family: familyId,
      user: userId,
      shareTransactions: false,
      shareAssets: false,
      shareLoans: false,
      shareNetWorth: false,
      shareEverything: false,
    };
  }

  return sharing.toObject();
};

// ─── Family Dashboard ────────────────────────────────────────────────────────

/**
 * Calculate family financial dashboard
 * Only shows data that members have chosen to share
 *
 * @param {string} familyId
 * @param {string} requestingUserId
 * @returns {Promise<object>}
 */
const getFamilyDashboard = async (familyId, requestingUserId) => {
  const family = await Family.findOne({
    _id: familyId,
    isDeleted: false,
  });

  if (!family) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, FAMILY_MESSAGES.FAMILY_NOT_FOUND);
  }

  if (!hasAccess(family, requestingUserId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, FAMILY_MESSAGES.FORBIDDEN);
  }

  // Get all members who share at least something
  const sharings = await FamilySharing.find({
    family: familyId,
    $or: [
      { shareTransactions: true },
      { shareAssets: true },
      { shareLoans: true },
      { shareNetWorth: true },
    ],
  });

  const memberIds = sharings.map((s) => s.user);
  const sharingMap = Object.fromEntries(sharings.map((s) => [s.user.toString(), s]));

  // Aggregate shared data
  let totalSharedAssets = 0;
  let totalSharedLiabilities = 0;
  const sharedTransactions = [];
  let sharedExpenses = 0;
  const spendingByMember = [];

  // Get transactions from members who share
  if (memberIds.length > 0) {
    const transactionResults = await Transaction.aggregate([
      {
        $match: {
          user: { $in: memberIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$user",
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "Credit"] }, "$amount", 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "Debit"] }, "$amount", 0],
            },
          },
          transactions: { $push: "$$ROOT" },
        },
      },
    ]);

    for (const result of transactionResults) {
      const userId = result._id.toString();
      const sharing = sharingMap[userId];

      if (sharing && sharing.shareTransactions) {
        sharedExpenses += result.expenses;
        spendingByMember.push({
          user: userId,
          income: r2(result.income),
          expenses: r2(result.expenses),
          transactionCount: result.transactions.length,
        });
      }
    }
  }

  // Get assets from members who share
  if (memberIds.length > 0) {
    const assets = await Asset.find({
      user: { $in: memberIds },
    });

    for (const asset of assets) {
      const userId = asset.user.toString();
      const sharing = sharingMap[userId];

      if (sharing && sharing.shareAssets) {
        totalSharedAssets += asset.currentValue;
      }
    }
  }

  // Get loans from members who share
  if (memberIds.length > 0) {
    const loans = await Loan.find({
      user: { $in: memberIds },
      loanStatus: LOAN_STATUS.ACTIVE,
    });

    for (const loan of loans) {
      const userId = loan.user.toString();
      const sharing = sharingMap[userId];

      if (sharing && sharing.shareLoans) {
        totalSharedLiabilities += loan.outstandingBalance;
      }
    }
  }

  return {
    familyName: family.familyName,
    memberCount: family.members.length,
    sharedCombined: {
      totalAssets: r2(totalSharedAssets),
      totalLiabilities: r2(totalSharedLiabilities),
      netWorth: r2(totalSharedAssets - totalSharedLiabilities),
    },
    sharedExpenses: r2(sharedExpenses),
    spendingByMember,
    membersSharing: memberIds.length,
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const familyService = {
  createFamily,
  getFamily,
  listFamilies,
  updateFamily,
  deleteFamily,
  sendInvitation,
  listInvitations,
  acceptInvitation,
  rejectInvitation,
  removeMember,
  leaveFamily,
  listMembers,
  updateSharing,
  getSharing: getSharingPreferences,
  getFamilyDashboard,
};
