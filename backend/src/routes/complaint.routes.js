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
  createComplaintSchema,
  verifyOtpSchema,
  confirmResolutionSchema,
  reopenComplaintSchema
} from "../controllers/complaint.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadAttachments } from "../middleware/upload.js";

const router = Router();

// Public / Location endpoints
router.get("/locations", getCampusLocations);
router.get("/similar", getSimilarComplaints);
router.get("/public", getPublicComplaints);

// Authenticated student endpoints
router.use(authenticate);

router.post("/", uploadAttachments, validate(createComplaintSchema), createComplaint);
router.get("/mine", getMyComplaints);
router.get("/:id", getComplaintById);
router.post("/:id/upvote", upvoteComplaint);
router.post("/:id/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/:id/confirm", validate(confirmResolutionSchema), confirmResolution);
router.post("/:id/reopen", validate(reopenComplaintSchema), reopenComplaint);

export default router;
