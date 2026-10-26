import { z } from "zod";
import { Complaint } from "../models/Complaint.js";
import { Department } from "../models/Department.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  CAMPUS_LOCATIONS,
  AUDIT_ACTIONS,
  VERIFICATION_METHODS,
  ROLES,
  NAAC_INSPECTION_STATUSES
} from "../utils/constants.js";
import { calculatePriorityAndScore } from "../utils/priority.js";
import { calculateSlaDueAt, recomputeSlaOnPriorityChange } from "../services/sla.service.js";
import { verifyResolutionOtp } from "../services/otp.service.js";
import { createAuditLog } from "../services/audit.service.js";
import { escalateComplaint } from "../services/escalation.service.js";

import {
  processUploadsToCloudinary,
  cleanupUploadedAssets
} from "../middleware/upload.js";
import {
  notifyComplaintCreated,
  notifyComplaintStatusUpdated,
  notifyComplaintUpvoted,
  notifyComplaintReopened,
  notifyComplaintAssigned,
  notifyNaacInspected,
  notifyNaacActionConfirmed
} from "../services/notification.service.js";

// Zod schemas for complaints
export const createComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Invalid category" }) }),
  block: z.string().min(1, "Location block is required"),
  floor: z.string().min(1, "Location floor is required"),
  room: z.string().min(1, "Location room is required"),
  studentName: z.string().optional(),
  studentDept: z.string().optional(),
  isAnonymous: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  isSevere: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional()
});

export const naacInspectionSchema = z.object({
  inspectorName: z.string().min(2, "Inspector name is required"),
  inspectorDesignation: z.string().min(2, "Inspector designation is required"),
  inspectionFindings: z.string().min(5, "Inspection findings are required"),
  verifiedSeverity: z.string().optional(),
  directiveSlaHours: z.coerce.number().optional()
});

export const naacActionConfirmSchema = z.object({
  actionType: z.string().min(3, "Action type is required"),
  actionDetails: z.string().min(5, "Action details are required"),
  complianceGrade: z.string().optional(),
  directiveSlaHours: z.coerce.number().optional(),
  inspectorName: z.string().optional()
});

export const verifyOtpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, "OTP must be a 4-digit number"),
  rating: z.coerce.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

export const confirmResolutionSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  feedback: z.string().optional()
});

export const reopenComplaintSchema = z.object({
  reason: z.string().min(5, "A descriptive reason (min 5 chars) is required to reopen the complaint")
});

/**
 * GET /api/locations
 * Returns cascading campus locations tree
 */
export const getCampusLocations = asyncHandler(async (_req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { locations: CAMPUS_LOCATIONS }, "Locations fetched successfully.")
  );
});

/**
 * GET /api/complaints/similar
 * MongoDB $text similarity search for active duplicate tickets
 */
export const getSimilarComplaints = asyncHandler(async (req, res) => {
  const { title, block, floor, room } = req.query;

  if (!title || title.trim().length < 3) {
    return res.status(200).json(new ApiResponse(200, { similarComplaints: [] }));
  }

  const activeStatuses = [
    STATUSES.SUBMITTED,
    STATUSES.ASSIGNED,
    STATUSES.IN_PROGRESS,
    STATUSES.ESCALATED,
    STATUSES.REOPENED
  ];

  const matchQuery = {
    status: { $in: activeStatuses },
    $text: { $search: title.trim() }
  };

  if (block) {
    matchQuery["location.block"] = block.trim();
  }
  if (floor) {
    matchQuery["location.floor"] = floor.trim();
  }
  if (room) {
    matchQuery["location.room"] = room.trim();
  }

  const similar = await Complaint.find(
    matchQuery,
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(5)
    .populate("department", "name code")
    .lean();

  const formatted = similar.map((item) => ({
    _id: item._id,
    ticketId: item.ticketId,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    location: item.location,
    upvoteCount: item.upvoteCount,
    createdAt: item.createdAt,
    similarityScore: Math.round((item.score || 1) * 10)
  }));

  return res.status(200).json(
    new ApiResponse(200, { similarComplaints: formatted }, "Similar complaints retrieved.")
  );
});

/**
 * POST /api/complaints
 * Create a new complaint with media upload and auto-routing to department
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, block, floor, room, studentName, studentDept, isAnonymous, isSevere } = req.body;


  // Validate location exists in config tree
  const matchedBlock = CAMPUS_LOCATIONS.find((b) => b.block.toLowerCase() === block.trim().toLowerCase());
  if (!matchedBlock) {
    throw new ApiError(400, `Invalid campus block: ${block}`);
  }

  const fullPath = `${block} > ${floor} > ${room}`;

  // Find department configured to handle this category
  let department = await Department.findOne({ categoriesHandled: category, isActive: true });
  if (!department) {
    // Fallback to General Maintenance or primary department
    department = await Department.findOne({ isActive: true });
  }

  // Upload attachments to Cloudinary
  let uploadedAssets = [];
  if (req.files && req.files.length > 0) {
    try {
      uploadedAssets = await processUploadsToCloudinary(req.files, "complaints");
    } catch (err) {
      throw new ApiError(500, `File upload failed: ${err.message}`);
    }
  }

  try {
    // Initial priority calculation
    const isEmergencyCategory = ["ragging", "harassment", "electrical", "leakage"].includes(category);
    const isSevereFlagged = Boolean(isSevere) || isEmergencyCategory || ["misuse", "food_mess"].includes(category);
    const initialPriority = ["ragging", "harassment"].includes(category)
      ? PRIORITIES.EMERGENCY
      : isSevereFlagged
      ? PRIORITIES.HIGH
      : PRIORITIES.LOW;

    const { priorityScore } = calculatePriorityAndScore({
      category,
      upvoteCount: 0,
      createdAt: new Date(),
      currentPriority: initialPriority
    });

    const { dueAt, hours } = calculateSlaDueAt(initialPriority);

    // Auto-assign to an active staff member in the department with the lowest active load
    let assignedStaff = null;
    let initialStatus = STATUSES.SUBMITTED;
    const historyEntries = [
      {
        status: STATUSES.SUBMITTED,
        changedBy: req.user._id,
        at: new Date(),
        note: category === "ragging"
          ? "🚨 URGENT: Anti-Ragging Grievance Registered - Zero-Tolerance Emergency SLA & NAAC Committee Notification Dispatched."
          : category === "misuse"
          ? "Campus Facility / Asset Misuse Grievance Reported - Dispatched to Discipline & Security Oversight."
          : isSevereFlagged
          ? "Severe Complaint submitted by student - Flagged for NAAC Committee Inspection."
          : "Complaint submitted by student."
      }
    ];

    if (department) {
      const availableStaff = await User.find({
        role: ROLES.STAFF,
        department: department._id,
        isActive: true
      });

      if (availableStaff.length > 0) {
        const staffLoads = await Promise.all(
          availableStaff.map(async (st) => {
            const count = await Complaint.countDocuments({
              assignedTo: st._id,
              status: { $in: [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS] }
            });
            return { staff: st, count };
          })
        );

        staffLoads.sort((a, b) => a.count - b.count);
        assignedStaff = staffLoads[0].staff;
        initialStatus = STATUSES.ASSIGNED;

        historyEntries.push({
          status: STATUSES.ASSIGNED,
          changedBy: null,
          at: new Date(),
          note: `Auto-routed & assigned to technician ${assignedStaff.name} (${department.name})`
        });
      }
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      department: department?._id || null,
      priority: initialPriority,
      priorityScore,
      status: initialStatus,
      location: {
        block,
        floor,
        room,
        fullPath
      },
      attachments: uploadedAssets,
      createdBy: req.user._id,
      studentName: (studentName || req.user.name || "").trim(),
      studentDept: (studentDept || "General Student").trim(),
      isAnonymous: Boolean(isAnonymous),
      assignedTo: assignedStaff?._id || null,
      assignedAt: assignedStaff ? new Date() : null,
      sla: {
        dueAt,
        hours,
        breached: false,
        escalationLevel: 0
      },
      naacReview: isSevereFlagged
        ? {
            isSevere: true,
            requiresInspection: true,
            inspectionStatus: NAAC_INSPECTION_STATUSES.PENDING_INSPECTION,
            verifiedSeverity: category === "ragging"
              ? "Critical Anti-Ragging Violation"
              : category === "misuse"
              ? "Campus Property & Resource Misuse"
              : isEmergencyCategory
              ? "Severe Hazard"
              : "High Severity Infrastructure"
          }
        : {
            isSevere: false,
            requiresInspection: false,
            inspectionStatus: NAAC_INSPECTION_STATUSES.NONE
          },
      statusHistory: historyEntries
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      entityType: "Complaint",
      entityId: complaint._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      metadata: {
        ticketId: complaint.ticketId,
        category,
        priority: initialPriority,
        isAnonymous: Boolean(isAnonymous),
        assignedTo: assignedStaff?._id || null
      }
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("department", "name code")
      .populate("assignedTo", "name email role staffType")
      .populate("createdBy", "name email role");

    await notifyComplaintCreated(populatedComplaint);

    if (assignedStaff) {
      await notifyComplaintAssigned(populatedComplaint, assignedStaff);
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        { complaint: populatedComplaint.toPublicJSON(req.user._id) },
        "Complaint registered successfully."
      )
    );
  } catch (dbError) {
    // Clean up uploaded Cloudinary assets if DB save fails
    if (uploadedAssets.length > 0) {
      await cleanupUploadedAssets(uploadedAssets);
    }
    throw dbError;
  }
});

/**
 * GET /api/complaints/mine
 * Student's personal complaints with pagination and status filter
 */
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { createdBy: req.user._id };
  if (status) {
    query.status = status;
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate("department", "name code")
      .populate("assignedTo", "name role staffType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(query)
  ]);

  const serialized = complaints.map((c) => c.toPublicJSON(req.user._id));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        complaints: serialized,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      "Complaints retrieved."
    )
  );
});

/**
 * GET /api/complaints/public
 * Public feed of active complaints (with anonymity strictly applied)
 */
export const getPublicComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, category, block, status } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  } else {
    // By default show active or recently resolved issues
    query.status = { $ne: STATUSES.CLOSED };
  }

  if (category) query.category = category;
  if (block) query["location.block"] = block;

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate("department", "name code")
      .populate("createdBy", "name email role")
      .sort({ upvoteCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(query)
  ]);

  const serialized = complaints.map((c) => c.toPublicJSON(req.user?._id));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        complaints: serialized,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      "Public complaints retrieved."
    )
  );
});

/**
 * GET /api/complaints/:id
 */
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("department", "name code")
    .populate("createdBy", "name email phone role")
    .populate("assignedTo", "name email phone role staffType performance")
    .populate("statusHistory.changedBy", "name role");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  const serialized = complaint.toPublicJSON(req.user?._id);

  return res.status(200).json(
    new ApiResponse(200, { complaint: serialized }, "Complaint fetched successfully.")
  );
});

/**
 * POST /api/complaints/:id/upvote
 * Atomic upvote toggle + auto-priority score recalculation
 */
export const upvoteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  // Prevent creator from upvoting their own ticket
  if (complaint.createdBy.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot upvote your own complaint.");
  }

  // Check if already upvoted
  const alreadyUpvoted = complaint.upvotes.some(
    (u) => u.toString() === req.user._id.toString()
  );

  let updatedComplaint;
  if (alreadyUpvoted) {
    // Atomic toggle off
    updatedComplaint = await Complaint.findByIdAndUpdate(
      complaint._id,
      {
        $pull: { upvotes: req.user._id },
        $inc: { upvoteCount: -1 }
      },
      { new: true }
    );
  } else {
    // Atomic toggle on ($addToSet)
    updatedComplaint = await Complaint.findByIdAndUpdate(
      complaint._id,
      {
        $addToSet: { upvotes: req.user._id },
        $inc: { upvoteCount: 1 }
      },
      { new: true }
    );
  }

  // Recalculate priority & score
  const { priorityScore, priority, hasPriorityChanged } = calculatePriorityAndScore({
    category: updatedComplaint.category,
    upvoteCount: updatedComplaint.upvoteCount,
    createdAt: updatedComplaint.createdAt,
    currentPriority: updatedComplaint.priority
  });

  const updateFields = { priorityScore };

  if (hasPriorityChanged) {
    updateFields.priority = priority;

    // Recompute SLA (shortens deadline only, never extends)
    const { dueAt, hours } = recomputeSlaOnPriorityChange(
      updatedComplaint.sla.dueAt,
      priority,
      updatedComplaint.createdAt
    );

    updateFields["sla.dueAt"] = dueAt;
    updateFields["sla.hours"] = hours;

    await createAuditLog({
      action: AUDIT_ACTIONS.COMPLAINT_STATUS_UPDATED,
      entityType: "Complaint",
      entityId: updatedComplaint._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      metadata: {
        upvoteCount: updatedComplaint.upvoteCount,
        newPriority: priority,
        newDueAt: dueAt
      }
    });
  }

  const finalComplaint = await Complaint.findByIdAndUpdate(
    updatedComplaint._id,
    { $set: updateFields },
    { new: true }
  );

  await notifyComplaintUpvoted(finalComplaint, hasPriorityChanged);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        upvoted: !alreadyUpvoted,
        upvoteCount: finalComplaint.upvoteCount,
        priority: finalComplaint.priority,
        priorityScore: finalComplaint.priorityScore
      },
      alreadyUpvoted ? "Upvote removed." : "Complaint upvoted successfully."
    )
  );
});

/**
 * POST /api/complaints/:id/verify-otp
 * Student completes dual proof-of-work with 4-digit OTP
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, rating, feedback } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the student who logged this complaint can verify its resolution.");
  }

  if (complaint.status !== STATUSES.PENDING_VERIFICATION) {
    throw new ApiError(400, "Complaint is not awaiting resolution verification.");
  }

  // Validate OTP
  await verifyResolutionOtp(complaint._id, otp);

  const now = new Date();
  const resolutionTimeMinutes = Math.max(
    1,
    Math.round((now.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60))
  );

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        status: STATUSES.CLOSED,
        "resolution.verifiedAt": now,
        "resolution.verificationMethod": VERIFICATION_METHODS.OTP,
        "resolution.rating": rating || 5,
        "resolution.feedback": feedback || "Verified via OTP"
      },
      $push: {
        statusHistory: {
          status: STATUSES.CLOSED,
          changedBy: req.user._id,
          at: now,
          note: `Resolution verified with OTP. Rating: ${rating || 5}/5`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  // Update staff member performance stats
  if (complaint.assignedTo) {
    const staffId = complaint.assignedTo;
    const staff = await User.findById(staffId);
    if (staff) {
      const prevCount = staff.performance?.resolvedCount || 0;
      const prevAvg = staff.performance?.avgResolutionMinutes || 0;
      const newAvg = Math.round((prevAvg * prevCount + resolutionTimeMinutes) / (prevCount + 1));

      await User.findByIdAndUpdate(staffId, {
        $inc: {
          "performance.resolvedCount": 1,
          "performance.totalRatingSum": rating || 5,
          "performance.ratingCount": 1
        },
        $set: {
          "performance.avgResolutionMinutes": newAvg
        }
      });
    }
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_VERIFIED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { method: VERIFICATION_METHODS.OTP, rating }
  });

  await notifyComplaintStatusUpdated(updatedComplaint, "Verified and closed via student OTP");

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      "Complaint resolution verified and ticket closed successfully."
    )
  );
});

/**
 * POST /api/complaints/:id/confirm
 * Student confirms resolution by rating (fallback or direct confirmation)
 */
export const confirmResolution = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the ticket owner can confirm resolution.");
  }

  if (complaint.status !== STATUSES.PENDING_VERIFICATION) {
    throw new ApiError(400, "Complaint is not awaiting resolution verification.");
  }

  const now = new Date();
  const resolutionTimeMinutes = Math.max(
    1,
    Math.round((now.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60))
  );

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        status: STATUSES.CLOSED,
        "resolution.verifiedAt": now,
        "resolution.verificationMethod": VERIFICATION_METHODS.CONFIRMATION,
        "resolution.rating": rating,
        "resolution.feedback": feedback || ""
      },
      $push: {
        statusHistory: {
          status: STATUSES.CLOSED,
          changedBy: req.user._id,
          at: now,
          note: `Resolution confirmed by student with rating: ${rating}/5`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  // Update staff stats
  if (complaint.assignedTo) {
    const staffId = complaint.assignedTo;
    const staff = await User.findById(staffId);
    if (staff) {
      const prevCount = staff.performance?.resolvedCount || 0;
      const prevAvg = staff.performance?.avgResolutionMinutes || 0;
      const newAvg = Math.round((prevAvg * prevCount + resolutionTimeMinutes) / (prevCount + 1));

      await User.findByIdAndUpdate(staffId, {
        $inc: {
          "performance.resolvedCount": 1,
          "performance.totalRatingSum": rating,
          "performance.ratingCount": 1
        },
        $set: {
          "performance.avgResolutionMinutes": newAvg
        }
      });
    }
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_VERIFIED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { method: VERIFICATION_METHODS.CONFIRMATION, rating }
  });

  await notifyComplaintStatusUpdated(updatedComplaint, `Confirmed and rated: ${rating} stars`);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      "Resolution confirmed and ticket closed."
    )
  );
});

/**
 * POST /api/complaints/:id/reopen
 * Student reopens complaint within 48 hours of resolution
 */
export const reopenComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the ticket owner can reopen this complaint.");
  }

  // Allowed only if pending_verification or closed within 48h
  const isPending = complaint.status === STATUSES.PENDING_VERIFICATION;
  const resolvedAtTime = complaint.resolution?.resolvedAt
    ? new Date(complaint.resolution.resolvedAt).getTime()
    : null;
  const within48Hours = resolvedAtTime && Date.now() - resolvedAtTime <= 48 * 60 * 60 * 1000;

  if (!isPending && !within48Hours) {
    throw new ApiError(
      400,
      "Tickets can only be reopened within 48 hours of resolution. Please submit a new complaint."
    );
  }

  // Bump priority one level (low -> medium, medium -> high, high -> emergency)
  const priorityProgression = {
    [PRIORITIES.LOW]: PRIORITIES.MEDIUM,
    [PRIORITIES.MEDIUM]: PRIORITIES.HIGH,
    [PRIORITIES.HIGH]: PRIORITIES.EMERGENCY,
    [PRIORITIES.EMERGENCY]: PRIORITIES.EMERGENCY
  };
  const bumpedPriority = priorityProgression[complaint.priority] || PRIORITIES.HIGH;

  // Reset SLA with bumped priority
  const { dueAt, hours } = calculateSlaDueAt(bumpedPriority, new Date());
  const now = new Date();

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        status: STATUSES.REOPENED,
        priority: bumpedPriority,
        "sla.dueAt": dueAt,
        "sla.hours": hours,
        "sla.breached": false,
        "reopen.lastReopenedAt": now
      },
      $inc: { "reopen.count": 1 },
      $push: {
        "reopen.reasons": { reason, at: now },
        statusHistory: {
          status: STATUSES.REOPENED,
          changedBy: req.user._id,
          at: now,
          note: `Reopened by student: "${reason}". Priority bumped to ${bumpedPriority}`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  // Charge reopen against staff scorecard
  if (complaint.assignedTo) {
    await User.findByIdAndUpdate(complaint.assignedTo, {
      $inc: { "performance.reopenedCount": 1 }
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_REOPENED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { reason, bumpedPriority }
  });

  await notifyComplaintReopened(updatedComplaint, reason);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      "Complaint reopened. Priority elevated and staff notified."
    )
  );
});

/**
 * GET /api/complaints/naac/severe
 * Fetch all severe grievances flagged for or requiring NAAC Inspection
 */
export const getSevereNaacComplaints = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = {
    $or: [
      { "naacReview.isSevere": true },
      { priority: { $in: [PRIORITIES.HIGH, PRIORITIES.EMERGENCY] } },
      { "sla.breached": true }
    ]
  };

  if (status && status !== "all") {
    query["naacReview.inspectionStatus"] = status;
  }

  if (search && search.trim()) {
    query.$and = [
      {
        $or: [
          { title: { $regex: search.trim(), $options: "i" } },
          { ticketId: { $regex: search.trim(), $options: "i" } },
          { "location.fullPath": { $regex: search.trim(), $options: "i" } }
        ]
      }
    ];
  }

  const complaints = await Complaint.find(query)
    .populate("department", "name code")
    .populate("assignedTo", "name email role staffType")
    .populate("createdBy", "name email role")
    .populate("naacReview.inspectedBy", "name email role")
    .populate("naacReview.actionConfirmedBy", "name email role")
    .sort({ "naacReview.isSevere": -1, priorityScore: -1, createdAt: -1 });

  const totalSevere = await Complaint.countDocuments({
    $or: [{ "naacReview.isSevere": true }, { priority: { $in: [PRIORITIES.HIGH, PRIORITIES.EMERGENCY] } }]
  });
  const pendingInspection = await Complaint.countDocuments({
    $or: [{ "naacReview.isSevere": true }, { priority: { $in: [PRIORITIES.HIGH, PRIORITIES.EMERGENCY] } }],
    "naacReview.inspectionStatus": { $in: ["none", "pending_inspection"] }
  });
  const inspected = await Complaint.countDocuments({
    "naacReview.inspectionStatus": "inspected"
  });
  const actionConfirmed = await Complaint.countDocuments({
    "naacReview.inspectionStatus": "action_confirmed"
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          totalSevere,
          pendingInspection,
          inspected,
          actionConfirmed
        },
        complaints: complaints.map((c) => (c.toPublicJSON ? c.toPublicJSON(req.user?._id) : c))
      },
      "Severe NAAC complaints fetched."
    )
  );
});

/**
 * POST /api/complaints/:id/naac-inspect
 * Record on-site NAAC Inspection Visit findings
 */
export const conductNaacInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { inspectorName, inspectorDesignation, inspectionFindings, verifiedSeverity, directiveSlaHours } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  const now = new Date();
  const inspector = inspectorName || req.user.name;
  const designation = inspectorDesignation || "NAAC Quality Committee Member";

  complaint.naacReview = {
    ...complaint.naacReview,
    isSevere: true,
    requiresInspection: true,
    inspectionStatus: NAAC_INSPECTION_STATUSES.INSPECTED,
    inspectedAt: now,
    inspectedBy: req.user._id,
    inspectorName: inspector,
    inspectorDesignation: designation,
    inspectionFindings,
    verifiedSeverity: verifiedSeverity || "Severe Hazard",
    directiveSlaHours: directiveSlaHours ? Number(directiveSlaHours) : complaint.naacReview?.directiveSlaHours
  };

  complaint.statusHistory.push({
    status: complaint.status,
    changedBy: req.user._id,
    at: now,
    note: `NAAC On-site Inspection completed by ${inspector} (${designation}). Observation: "${inspectionFindings}"`
  });

  await complaint.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.NAAC_INSPECTION_CONDUCTED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      ticketId: complaint.ticketId,
      inspectorName: inspector,
      inspectorDesignation: designation,
      findings: inspectionFindings
    }
  });

  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate("department", "name code")
    .populate("assignedTo", "name email role staffType")
    .populate("createdBy", "name email role")
    .populate("naacReview.inspectedBy", "name email role");

  await notifyNaacInspected(updatedComplaint);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      "NAAC Inspection Visit logged successfully."
    )
  );
});

/**
 * POST /api/complaints/:id/naac-action-confirm
 * Take action and generate official NAAC Action Confirmation Slip
 */
export const confirmNaacAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actionType, actionDetails, complianceGrade, directiveSlaHours, inspectorName } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  const now = new Date();
  const year = now.getFullYear();
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const actionConfirmationSlipId = `NAAC-ACT-${year}-${randomCode}`;

  complaint.naacReview = {
    ...complaint.naacReview,
    isSevere: true,
    inspectionStatus: NAAC_INSPECTION_STATUSES.ACTION_CONFIRMED,
    actionType,
    actionDetails,
    actionConfirmedAt: now,
    actionConfirmedBy: req.user._id,
    actionConfirmationSlipId,
    complianceGrade: complianceGrade || "A+",
    directiveSlaHours: directiveSlaHours ? Number(directiveSlaHours) : 4,
    inspectorName: inspectorName || complaint.naacReview?.inspectorName || req.user.name
  };

  // Adjust SLA deadline strictly if directive SLA hours provided
  if (directiveSlaHours) {
    const hours = Number(directiveSlaHours);
    complaint.sla.dueAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
    complaint.sla.hours = hours;
  }

  complaint.statusHistory.push({
    status: complaint.status,
    changedBy: req.user._id,
    at: now,
    note: `NAAC Official Action Confirmed: [${actionType}]. Slip ID: ${actionConfirmationSlipId}. Directive: "${actionDetails}"`
  });

  await complaint.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.NAAC_ACTION_CONFIRMED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      ticketId: complaint.ticketId,
      actionConfirmationSlipId,
      actionType,
      actionDetails,
      complianceGrade
    }
  });

  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate("department", "name code")
    .populate("assignedTo", "name email role staffType")
    .populate("createdBy", "name email role")
    .populate("naacReview.inspectedBy", "name email role")
    .populate("naacReview.actionConfirmedBy", "name email role");

  await notifyNaacActionConfirmed(updatedComplaint);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        complaint: updatedComplaint.toPublicJSON(req.user._id),
        confirmationSlip: {
          slipId: actionConfirmationSlipId,
          ticketId: complaint.ticketId,
          complaintTitle: complaint.title,
          location: complaint.location?.fullPath,
          actionType,
          actionDetails,
          complianceGrade: complianceGrade || "A+",
          confirmedAt: now,
          confirmedByName: req.user.name,
          confirmedByRole: req.user.role,
          collegeName: "Smart College of Engineering & Technology",
          naacAccreditationCycle: "Cycle 4 - Institutional Grievance & Redressal Cell"
        }
      },
      "NAAC Action Confirmed and Official Slip generated."
    )
  );
});

/**
 * GET /api/complaints/:id/naac-action-slip
 * Fetch official verified NAAC action slip
 */
export const getNaacActionSlip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id)
    .populate("department", "name code")
    .populate("assignedTo", "name email role staffType")
    .populate("createdBy", "name email role")
    .populate("naacReview.inspectedBy", "name email role")
    .populate("naacReview.actionConfirmedBy", "name email role");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (!complaint.naacReview?.actionConfirmationSlipId) {
    throw new ApiError(400, "NAAC Action Confirmation Slip has not been generated for this complaint yet.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        slip: {
          slipId: complaint.naacReview.actionConfirmationSlipId,
          ticketId: complaint.ticketId,
          complaintTitle: complaint.title,
          category: complaint.category,
          location: complaint.location?.fullPath,
          studentName: complaint.isAnonymous ? "Anonymous Student" : complaint.createdBy?.name,
          studentEmail: complaint.isAnonymous ? "Protected" : complaint.createdBy?.email,
          inspectionFindings: complaint.naacReview.inspectionFindings,
          inspectedAt: complaint.naacReview.inspectedAt,
          inspectorName: complaint.naacReview.inspectorName,
          inspectorDesignation: complaint.naacReview.inspectorDesignation,
          actionType: complaint.naacReview.actionType,
          actionDetails: complaint.naacReview.actionDetails,
          complianceGrade: complaint.naacReview.complianceGrade,
          confirmedAt: complaint.naacReview.actionConfirmedAt,
          confirmedBy: complaint.naacReview.actionConfirmedBy?.name || "NAAC Quality Officer",
          department: complaint.department?.name,
          assignedTechnician: complaint.assignedTo?.name || "Pending Assignment",
          collegeName: "Smart College of Engineering & Technology",
          accreditationRef: "NAAC-SSR-CRITERION-V-STUDENT-SUPPORT-V2"
        }
      },
      "NAAC Action Slip fetched successfully."
    )
  );
});

/**
 * POST /api/complaints/:id/trigger-3day-escalation
 * Simulate / trigger statutory 3-day inaction escalation to NAAC Higher Committee
 */
export const trigger3DayEscalation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  // Set created date to 3.5 days ago to reflect 3-day inaction
  complaint.createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);
  await complaint.save();

  const escalated = await escalateComplaint(id, "3-Day Inaction SLA Breach - Mandatory NAAC Institutional Oversight Triggered");

  return res.status(200).json(
    new ApiResponse(200, { complaint: escalated?.toPublicJSON(req.user._id) || complaint }, "Ticket escalated to NAAC Higher Committee due to 3-day inaction.")
  );
});

