import { z } from "zod";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Complaint } from "../models/Complaint.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ROLES,
  STAFF_TYPES,
  CATEGORIES,
  STATUSES,
  AUDIT_ACTIONS
} from "../utils/constants.js";
import { createAuditLog, getAuditLogs } from "../services/audit.service.js";
import {
  getResolutionTimeByDepartment,
  getLocationHeatmap,
  getStaffPerformanceScorecards,
  getSystemOverviewMetrics
} from "../services/analytics.service.js";
import {
  notifyComplaintAssigned,
  notifyComplaintStatusUpdated
} from "../services/notification.service.js";

// Validation schemas for admin actions
export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([ROLES.STUDENT, ROLES.STAFF, ROLES.ADMIN]),
  staffType: z.enum([STAFF_TYPES.MAINTENANCE, STAFF_TYPES.DEPARTMENT_HEAD]).optional().nullable(),
  department: z.string().optional().nullable(),
  phone: z.string().optional()
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  categoriesHandled: z.array(z.enum(CATEGORIES)).min(1),
  head: z.string().optional().nullable(),
  escalationContact: z.string().optional().nullable()
});

export const assignTicketSchema = z.object({
  assignedTo: z.string().min(1, "Staff member ID is required"),
  note: z.string().optional()
});

export const forceCloseSchema = z.object({
  reason: z.string().min(5, "A reason is required for administrative force-closure")
});

/**
 * GET /api/admin/complaints
 * Comprehensive complaints list for admin with pagination and filters
 */
export const getAllComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, department, category, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (department) query.department = department;
  if (category) query.category = category;

  if (search) {
    query.$or = [
      { ticketId: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { "location.fullPath": { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate("department", "name code")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role staffType")
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
      "Admin complaints retrieved."
    )
  );
});

/**
 * PATCH /api/admin/complaints/:id/assign
 * Assign or reassign ticket to a staff member
 */
export const assignComplaint = asyncHandler(async (req, res) => {
  const { assignedTo, note } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  const staffUser = await User.findById(assignedTo);
  if (!staffUser || staffUser.role !== ROLES.STAFF) {
    throw new ApiError(400, "Assigned user must be an active staff member.");
  }

  const now = new Date();
  const nextStatus = complaint.status === STATUSES.SUBMITTED ? STATUSES.ASSIGNED : complaint.status;

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        assignedTo: staffUser._id,
        assignedAt: now,
        status: nextStatus
      },
      $push: {
        statusHistory: {
          status: nextStatus,
          changedBy: req.user._id,
          at: now,
          note: note || `Assigned to ${staffUser.name} (${staffUser.staffType}) by Admin.`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");

  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_ASSIGNED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      ticketId: complaint.ticketId,
      assignedTo: staffUser._id,
      assignedName: staffUser.name,
      note
    }
  });

  await notifyComplaintAssigned(updatedComplaint, staffUser);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      `Ticket successfully assigned to ${staffUser.name}.`
    )
  );
});

/**
 * POST /api/admin/complaints/:id/force-close
 * Admin force-closure with mandatory reasoning and audit logging
 */
export const forceCloseComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  const now = new Date();
  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaint._id,
    {
      $set: {
        status: STATUSES.CLOSED,
        "resolution.verifiedAt": now,
        "resolution.verificationMethod": "admin_force_closed",
        "resolution.notes": reason
      },
      $push: {
        statusHistory: {
          status: STATUSES.CLOSED,
          changedBy: req.user._id,
          at: now,
          note: `Force-closed by Admin. Reason: ${reason}`
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
    metadata: { forceClosed: true, reason }
  });

  await notifyComplaintStatusUpdated(updatedComplaint, `Force-closed by Admin: ${reason}`);

  return res.status(200).json(
    new ApiResponse(
      200,
      { complaint: updatedComplaint.toPublicJSON(req.user._id) },
      "Complaint force-closed successfully."
    )
  );
});

/**
 * POST /api/admin/complaints/:id/reveal-identity
 * Explicit audited action for administrator to reveal anonymous ticket author
 */
export const revealAnonymousIdentity = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate("createdBy", "name email phone role");

  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (!complaint.isAnonymous) {
    return res.status(200).json(
      new ApiResponse(200, { creator: complaint.createdBy }, "Ticket was not submitted anonymously.")
    );
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.IDENTITY_REVEALED,
    entityType: "Complaint",
    entityId: complaint._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: {
      ticketId: complaint.ticketId,
      revealedStudentId: complaint.createdBy._id,
      revealedEmail: complaint.createdBy.email
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ticketId: complaint.ticketId,
        revealedIdentity: {
          _id: complaint.createdBy._id,
          name: complaint.createdBy.name,
          email: complaint.createdBy.email,
          phone: complaint.createdBy.phone
        }
      },
      "Anonymous author identity revealed and recorded in audit log."
    )
  );
});

/**
 * GET /api/admin/audit-logs
 */
export const fetchAuditLogs = asyncHandler(async (req, res) => {
  const result = await getAuditLogs(req.query);
  return res.status(200).json(new ApiResponse(200, result, "Audit logs retrieved."));
});

// User Management Endpoints
export const getUsers = asyncHandler(async (req, res) => {
  const { role, department, page = 1, limit = 50, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(query)
    .populate("department", "name code")
    .sort({ createdAt: -1 })
    .skip((Math.max(1, Number(page)) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, { users, total }, "Users fetched successfully.")
  );
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, staffType, department, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    staffType: role === ROLES.STAFF ? staffType : null,
    department: role === ROLES.STAFF ? department : null,
    phone
  });

  // If added as staff to department, update department.staff array
  if (department && role === ROLES.STAFF) {
    await Department.findByIdAndUpdate(department, {
      $addToSet: { staff: user._id }
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.USER_CREATED,
    entityType: "User",
    entityId: user._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { email: user.email, role: user.role }
  });

  return res.status(201).json(new ApiResponse(201, { user }, "User created successfully."));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, role, staffType, department, phone, isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...(name && { name }),
        ...(role && { role }),
        ...(staffType !== undefined && { staffType }),
        ...(department !== undefined && { department }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive })
      }
    },
    { new: true }
  ).populate("department");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.USER_UPDATED,
    entityType: "User",
    entityId: user._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { updates: req.body }
  });

  return res.status(200).json(new ApiResponse(200, { user }, "User updated successfully."));
});

// Department Management Endpoints
export const getDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find()
    .populate("head", "name email")
    .populate("staff", "name email staffType")
    .populate("escalationContact", "name email");

  return res.status(200).json(
    new ApiResponse(200, { departments }, "Departments retrieved.")
  );
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, categoriesHandled, head, escalationContact } = req.body;

  const existing = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }]
  });

  if (existing) {
    throw new ApiError(409, "A department with this name or code already exists.");
  }

  const department = await Department.create({
    name,
    code,
    categoriesHandled,
    head: head || null,
    escalationContact: escalationContact || null
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
    entityType: "Department",
    entityId: department._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { name, code }
  });

  return res.status(201).json(new ApiResponse(201, { department }, "Department created successfully."));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );

  if (!department) {
    throw new ApiError(404, "Department not found.");
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
    entityType: "Department",
    entityId: department._id,
    performedBy: req.user._id,
    ipAddress: req.ip,
    metadata: { updates: req.body }
  });

  return res.status(200).json(new ApiResponse(200, { department }, "Department updated successfully."));
});

// Analytics Endpoints
export const getAnalyticsResolutionTime = asyncHandler(async (_req, res) => {
  const data = await getResolutionTimeByDepartment();
  return res.status(200).json(new ApiResponse(200, { resolutionTimes: data }, "Resolution times fetched."));
});

export const getAnalyticsLocations = asyncHandler(async (_req, res) => {
  const data = await getLocationHeatmap();
  return res.status(200).json(new ApiResponse(200, { heatmap: data }, "Location heatmap data fetched."));
});

export const getAnalyticsStaffPerformance = asyncHandler(async (_req, res) => {
  const data = await getStaffPerformanceScorecards();
  return res.status(200).json(new ApiResponse(200, { scorecards: data }, "Staff scorecards fetched."));
});

export const getAnalyticsOverview = asyncHandler(async (_req, res) => {
  const data = await getSystemOverviewMetrics();
  return res.status(200).json(new ApiResponse(200, { overview: data }, "Overview metrics fetched."));
});
