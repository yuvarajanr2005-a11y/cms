import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../utils/constants.js";
import { Complaint } from "../models/Complaint.js";

/**
 * Authorize specified roles
 * @param  {...string} roles
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: requires one of the following roles: [${roles.join(", ")}]`
        )
      );
    }

    next();
  };
};

/**
 * Authorize staff sub-types (e.g. department_head, maintenance)
 * Admins are also permitted through.
 */
export const authorizeStaffType = (...types) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (req.user.role !== ROLES.STAFF || !types.includes(req.user.staffType)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: requires staff sub-type [${types.join(", ")}] or admin.`
        )
      );
    }

    next();
  };
};

/**
 * Ensures student may only access their own complaint.
 * Staff and admins have broader access.
 */
export const checkComplaintOwnership = async (req, _res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new ApiError(400, "Complaint ID parameter is required."));
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return next(new ApiError(404, "Complaint not found."));
    }

    // Attach complaint to request for downstream controller efficiency
    req.complaint = complaint;

    // Admins and Staff have elevated permissions
    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.STAFF) {
      return next();
    }

    // Student ownership check
    if (complaint.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "You do not have permission to access or modify this complaint."));
    }

    next();
  } catch (error) {
    next(error);
  }
};
