import { Complaint } from "../models/Complaint.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  STATUSES,
  ROLES,
  AUDIT_ACTIONS,
  ALLOWED_STATUS_TRANSITIONS
} from "../utils/constants.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { createResolutionOtp } from "../services/otp.service.js";
import { createAuditLog } from "../services/audit.service.js";
import {
  notifyComplaintStatusUpdated,
  notifyComplaintResolved
} from "../services/notification.service.js";

/**
 * GET /api/staff/complaints
 * Returns assigned tickets queue sorted by SLA time remaining (ascending dueAt)
 */
export const getAssignedComplaints = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  const userDeptId = req.user.department?._id || req.user.department;

  if (req.user.role === ROLES.ADMIN) {
    // Admin can view all active complaints
  } else if (req.user.staffType === "department_head" && userDeptId) {
    query.department = userDeptId;
  } else if (userDeptId) {
    // Maintenance staff sees tickets assigned to them OR unassigned in their department
    query.$or = [
      { assignedTo: req.user._id },
      { department: userDeptId }
    ];
  } else {
    query.assignedTo = req.user._id;
  }

  if (status) {
    query.status = status;
  } else {
    query.status = { $nin: [STATUSES.CLOSED] };
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate("department", "name code")
      .populate("createdBy", "name email phone")
      .sort({ "sla.dueAt": 1 }) // Urgency first
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
      "Assigned complaints queue retrieved."
    )
  );
});

/**
 * PATCH /api/staff/complaints/:id/status
 * Updates status to in_progress or updates notes
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  // Authorization: must be assigned staff, department member, or admin
  const isAssigned = complaint.assignedTo?.toString() === req.user._id.toString();
  const userDeptId = req.user.department?._id?.toString() || req.user.department?.toString();
  const isDeptMember = userDeptId && complaint.department?.toString() === userDeptId;
  const isDeptHead = req.user.staffType === "department_head" && isDeptMember;
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isAssigned && !isDeptMember && !isAdmin) {
    throw new ApiError(403, "You do not have permission to update this ticket.");
  }

  // If unassigned and department staff is claiming / starting work
  const isClaiming = !complaint.assignedTo && isDeptMember;

  // Validate allowed transition
  const allowed = ALLOWED_STATUS_TRANSITIONS[complaint.status] || [];
  if (status && !allowed.includes(status) && !isClaiming) {
    throw new ApiError(
      400,
      `Invalid status transition from "${complaint.status}" to "${status}". Allowed transitions: [${allowed.join(", ")}]`
    );
  }

  const now = new Date();
  const targetStatus = status || complaint.status;
  const updateFields = { status: targetStatus };

  if (isClaiming) {
    updateFields.assignedTo = req.user._id;
    updateFields.assignedAt = now;
  }

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: updateFields,
      $push: {
        statusHistory: {
          status: targetStatus,
          changedBy: req.user._id,
          at: now,
          note: isClaiming
            ? `Ticket claimed by technician ${req.user.name}. ${note || ""}`
            : note || `Status updated to ${targetStatus} by staff.`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_STATUS_UPDATED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      fromStatus: complaint.status,
      toStatus: targetStatus,
      note
    }
  });

  await notifyComplaintStatusUpdated(updatedComplaint, note);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      `Status updated to ${targetStatus} successfully.`
    )
  );
});

/**
 * POST /api/staff/complaints/:id/resolve
 * Dual proof-of-work: Mandatory proof photo upload + OTP dispatch
 */
export const resolveComplaint = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  // Mandatory proof photo check
  if (!req.file) {
    throw new ApiError(400, "Proof of work photo is mandatory to resolve a complaint.");
  }

  // Authorization check
  const isAssigned = complaint.assignedTo?.toString() === req.user._id.toString();
  const isDeptHead =
    req.user.staffType === "department_head" &&
    complaint.department?.toString() === req.user.department?._id?.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isAssigned && !isDeptHead && !isAdmin) {
    throw new ApiError(403, "Only the assigned staff member, department head, or admin can resolve this complaint.");
  }

  // Check valid transition to pending_verification
  const allowed = ALLOWED_STATUS_TRANSITIONS[complaint.status] || [];
  if (!allowed.includes(STATUSES.PENDING_VERIFICATION)) {
    throw new ApiError(
      400,
      `Cannot resolve complaint from current status "${complaint.status}".`
    );
  }

  // Upload mandatory proof photo to Cloudinary
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    `complaints/${complaint.ticketId}/resolution`,
    `proof_${Date.now()}`
  );

  const now = new Date();

  // Set to pending_verification
  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        status: STATUSES.PENDING_VERIFICATION,
        "resolution.proofPhoto": {
          url: uploadResult.url,
          publicId: uploadResult.publicId
        },
        "resolution.notes": notes || "Work completed. Awaiting student verification.",
        "resolution.resolvedBy": req.user._id,
        "resolution.resolvedAt": now
      },
      $push: {
        statusHistory: {
          status: STATUSES.PENDING_VERIFICATION,
          changedBy: req.user._id,
          at: now,
          note: `Work resolved by staff with photographic proof. Awaiting OTP verification.`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  // Generate 4-digit cryptographically secure OTP and store hash with 48h expiry
  const rawOtp = await createResolutionOtp(complaint._id);

  // Send OTP to student via email and live socket
  const studentUser = await User.findById(complaint.createdBy);
  await notifyComplaintResolved(updatedComplaint, studentUser, rawOtp);

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_RESOLVED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      proofUrl: uploadResult.url,
      notes
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        complaint: updatedComplaint.toPublicJSON(req.user._id),
        message: "Resolution submitted with proof photo. Verification OTP dispatched to student."
      },
      "Complaint marked as pending verification."
    )
  );
});

/**
 * GET /api/staff/performance
 * Returns scorecard metrics for the logged-in staff member
 */
export const getStaffPerformance = asyncHandler(async (req, res) => {
  const staff = await User.findById(req.user._id).select("name email staffType department performance");
  return res.status(200).json(
    new ApiResponse(200, { performance: staff.performance }, "Performance scorecard fetched.")
  );
});
