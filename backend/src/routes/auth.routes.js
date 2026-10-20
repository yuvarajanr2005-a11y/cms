import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  registerSchema,
  loginSchema,
  changePasswordSchema
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { enforceCollegeEmailDomain } from "../middleware/emailDomain.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  enforceCollegeEmailDomain,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;
