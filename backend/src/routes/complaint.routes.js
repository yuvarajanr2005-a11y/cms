import { Router } from "express";
import {
  createComplaint,
  getMyComplaints,
  getPublicComplaints,
  getComplaintById,
  getSimilarComplaints,
  getCampusLocations,
  upvoteComplaint,
  verifyOtp,
  confirmResolution,
  reopenComplaint,
  getSevereNaacComplaints,
  conductNaacInspection,
  confirmNaacAction,
  getNaacActionSlip,
  trigger3DayEscalation,
  createComplaintSchema,
  verifyOtpSchema,
  confirmResolutionSchema,
  reopenComplaintSchema,
  naacInspectionSchema,
  naacActionConfirmSchema
} from "../controllers/complaint.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadAttachments } from "../middleware/upload.js";

const router = Router();

// Public / Location endpoints
router.get("/locations", getCampusLocations);
router.get("/similar", getSimilarComplaints);
router.get("/public", getPublicComplaints);

// Authenticated endpoints
router.use(authenticate);

// NAAC Severe & Inspection endpoints
router.get("/naac/severe", getSevereNaacComplaints);
router.post("/:id/naac-inspect", validate(naacInspectionSchema), conductNaacInspection);
router.post("/:id/naac-action-confirm", validate(naacActionConfirmSchema), confirmNaacAction);
router.get("/:id/naac-action-slip", getNaacActionSlip);

router.post("/", uploadAttachments, validate(createComplaintSchema), createComplaint);
router.get("/mine", getMyComplaints);
router.get("/:id", getComplaintById);
router.post("/:id/upvote", upvoteComplaint);
router.post("/:id/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/:id/confirm", validate(confirmResolutionSchema), confirmResolution);
router.post("/:id/reopen", validate(reopenComplaintSchema), reopenComplaint);
router.post("/:id/trigger-3day-escalation", trigger3DayEscalation);


export default router;
