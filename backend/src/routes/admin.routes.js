import { Router } from "express";
import {
  getAllComplaints,
  assignComplaint,
  forceCloseComplaint,
  revealAnonymousIdentity,
  fetchAuditLogs,
  getUsers,
  createUser,
  updateUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAnalyticsResolutionTime,
  getAnalyticsLocations,
  getAnalyticsStaffPerformance,
  getAnalyticsOverview,
  createUserSchema,
  createDepartmentSchema,
  assignTicketSchema,
  forceCloseSchema
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleCheck.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

// Strictly Admin-only routes
router.use(authenticate, authorize(ROLES.ADMIN));

// Complaints & Actions
router.get("/complaints", getAllComplaints);
router.patch("/complaints/:id/assign", validate(assignTicketSchema), assignComplaint);
router.post("/complaints/:id/force-close", validate(forceCloseSchema), forceCloseComplaint);
router.post("/complaints/:id/reveal-identity", revealAnonymousIdentity);

// Audit Trail
router.get("/audit-logs", fetchAuditLogs);

// Users Management
router.get("/users", getUsers);
router.post("/users", validate(createUserSchema), createUser);
router.patch("/users/:id", updateUser);

// Departments Management
router.get("/departments", getDepartments);
router.post("/departments", validate(createDepartmentSchema), createDepartment);
router.patch("/departments/:id", updateDepartment);

// Analytics Pipelines
router.get("/analytics/resolution-time", getAnalyticsResolutionTime);
router.get("/analytics/locations", getAnalyticsLocations);
router.get("/analytics/staff-performance", getAnalyticsStaffPerformance);
router.get("/analytics/overview", getAnalyticsOverview);

export default router;
