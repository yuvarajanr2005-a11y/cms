import crypto from "crypto";
import { z } from "zod";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME
} from "../config/jwt.js";
import { ROLES, AUDIT_ACTIONS } from "../utils/constants.js";
import { createAuditLog } from "../services/audit.service.js";

// Password complexity regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_-])[A-Za-z\d@$!%*?&#^()_-]{8,}$/;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .email("Invalid email format")
    .regex(/^[a-zA-Z0-9._%+-]+@college\.edu$/i, "Email must be a valid @college.edu address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    ),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().min(1, "Name, Username, or Email is required"),
  password: z.string().min(1, "Password is required")
});


export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    )
});

/**
 * Hash refresh token before persisting in DB
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Helper to set access and refresh tokens in HttpOnly cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(false));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(true));
};

/**
 * Helper to clear auth cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, getCookieOptions(false));
  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions(true));
};

/**
 * POST /api/auth/register
 * Student self-registration
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: ROLES.STUDENT
  });

  // Issue tokens
  const tokenPayload = { userId: user._id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store hashed refresh token
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  await createAuditLog({
    action: AUDIT_ACTIONS.USER_REGISTER,
    entityType: "User",
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
    metadata: { email: user.email, role: user.role }
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        accessToken
      },
      "Registration successful."
    )
  );
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const identifier = (email || "").trim();

  const isEmail = identifier.includes("@");
  let query;
  if (isEmail) {
    query = { email: identifier.toLowerCase() };
  } else {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query = {
      $or: [
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { name: { $regex: new RegExp(escaped, "i") } },
        { email: identifier.toLowerCase() }
      ]
    };
  }

  const user = await User.findOne(query)
    .select("+password +refreshTokenHash")
    .populate("department");

  if (!user) {
    throw new ApiError(401, "Invalid name/email or password.");
  }


  // Check account lockout
  if (user.isLocked()) {
    const remainingMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (1000 * 60));
    await createAuditLog({
      action: AUDIT_ACTIONS.USER_LOCKED,
      entityType: "Auth",
      entityId: user._id,
      ipAddress: req.ip,
      metadata: { email: user.email, attemptedWhileLocked: true }
    });
    throw new ApiError(
      423,
      `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`
    );
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact an administrator.");
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    const { attempts, isLocked } = await user.handleFailedLogin();
    if (isLocked) {
      await createAuditLog({
        action: AUDIT_ACTIONS.USER_LOCKED,
        entityType: "Auth",
        entityId: user._id,
        ipAddress: req.ip,
        metadata: { email: user.email, attempts }
      });
      throw new ApiError(
        423,
        "Account locked for 15 minutes due to 5 consecutive failed login attempts."
      );
    }
    throw new ApiError(401, `Invalid email or password. Attempt ${attempts} of 5.`);
  }

  // Reset failed attempts on success
  await user.resetFailedAttempts();

  // Generate tokens
  const tokenPayload = { userId: user._id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save hashed refresh token for rotation
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  await createAuditLog({
    action: AUDIT_ACTIONS.USER_LOGIN,
    entityType: "Auth",
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip,
    metadata: { role: user.role }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          staffType: user.staffType,
          department: user.department,
          phone: user.phone,
          avatar: user.avatar
        },
        accessToken
      },
      "Logged in successfully."
    )
  );
});

/**
 * POST /api/auth/refresh
 * Refresh Token Rotation (RTR)
 */
export const refresh = asyncHandler(async (req, res) => {
  let refreshToken = null;

  if (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) {
    refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  } else if (req.body && req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not provided.");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_err) {
    clearAuthCookies(res);
    throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new ApiError(401, "User no longer exists or has been deactivated.");
  }

  // Validate hashed refresh token against database
  const incomingHash = hashToken(refreshToken);
  if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
    // Potential token reuse detected! Invalidate all refresh tokens
    user.refreshTokenHash = null;
    await user.save();
    clearAuthCookies(res);
    throw new ApiError(401, "Suspicious session detected. All sessions terminated. Please log in again.");
  }

  // Issue new rotated tokens
  const tokenPayload = { userId: user._id, role: user.role, email: user.email };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Update DB with new hashed token
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  setAuthCookies(res, newAccessToken, newRefreshToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: newAccessToken },
      "Session refreshed successfully."
    )
  );
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  let userId = req.user?._id;

  if (!userId && req.cookies && req.cookies[ACCESS_COOKIE_NAME]) {
    try {
      const decoded = verifyRefreshToken(req.cookies[REFRESH_COOKIE_NAME] || req.cookies[ACCESS_COOKIE_NAME]);
      userId = decoded.userId;
    } catch (_e) {
      // ignore
    }
  }

  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, null, "Logged out successfully."));
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("department");
  return res.status(200).json(
    new ApiResponse(
      200,
      { user },
      "Profile fetched successfully."
    )
  );
});

/**
 * PATCH /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  user.password = newPassword;
  user.refreshTokenHash = null; // force re-login on all devices
  await user.save();

  clearAuthCookies(res);

  await createAuditLog({
    action: AUDIT_ACTIONS.PASSWORD_CHANGE,
    entityType: "User",
    entityId: user._id,
    performedBy: user._id,
    ipAddress: req.ip
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Password updated successfully. Please log in again with your new credentials."
    )
  );
});
