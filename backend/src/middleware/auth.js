import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken, ACCESS_COOKIE_NAME } from "../config/jwt.js";
import { User } from "../models/User.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  let token = null;

  // Cookie takes precedence
  if (req.cookies && req.cookies[ACCESS_COOKIE_NAME]) {
    token = req.cookies[ACCESS_COOKIE_NAME];
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Authentication required. Please log in.");
  }

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).populate("department");
    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated. Please contact support.");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh your session.");
    }
    throw new ApiError(401, "Invalid access token.");
  }
});
