import { Router } from "express";
import {
  getAssignedComplaints,
  updateComplaintStatus,
  resolveComplaint,
  getStaffPerformance
} from "../controllers/staff.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleCheck.js";
import { uploadProofPhoto } from "../middleware/upload.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

// Staff and Admin accessible routes
router.use(authenticate, authorize(ROLES.STAFF, ROLES.ADMIN));

router.get("/complaints", getAssignedComplaints);
router.patch("/complaints/:id/status", updateComplaintStatus);
router.post("/complaints/:id/resolve", uploadProofPhoto, resolveComplaint);
router.get("/performance", getStaffPerformance);

export default router;
