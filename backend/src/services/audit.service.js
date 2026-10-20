import { AuditLog } from "../models/AuditLog.js";

/**
 * Creates an append-only audit log entry
 */
export const createAuditLog = async ({
  action,
  entityType,
  entityId,
  performedBy = null,
  performedBySystem = false,
  metadata = {},
  ipAddress = null
}) => {
  try {
    const entry = await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy: performedBySystem ? null : performedBy,
      performedBySystem,
      metadata,
      ipAddress
    });
    return entry;
  } catch (error) {
    console.error("❌ Failed to create audit log entry:", error.message);
    // Never crash the request on audit log failure
    return null;
  }
};

/**
 * Retrieves paginated audit logs with optional filters
 */
export const getAuditLogs = async ({
  action,
  entityType,
  entityId,
  performedBy,
  startDate,
  endDate,
  page = 1,
  limit = 20
}) => {
  const query = {};

  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  if (performedBy) query.performedBy = performedBy;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate("performedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};
