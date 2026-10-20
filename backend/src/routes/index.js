import { Router } from "express";
import authRoutes from "./auth.routes.js";
import complaintRoutes from "./complaint.routes.js";
import staffRoutes from "./staff.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Smart College Complaint Management API"
  });
});

router.use("/auth", authRoutes);
router.use("/complaints", complaintRoutes);
router.use("/staff", staffRoutes);
router.use("/admin", adminRoutes);

export default router;
