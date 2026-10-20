import { ApiError } from "../utils/ApiError.js";

export const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@college\.edu$/i;

/**
 * Middleware ensuring only valid @college.edu emails can register as students
 */
export const enforceCollegeEmailDomain = (req, _res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, "Email address is required."));
  }

  if (!COLLEGE_EMAIL_REGEX.test(email.trim())) {
    return next(
      new ApiError(
        400,
        "Student registration is restricted strictly to official college email addresses ending in @college.edu."
      )
    );
  }

  next();
};
