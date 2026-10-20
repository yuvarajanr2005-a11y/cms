import { generateSecureOtp, hashOtp, verifyOtpHash } from "../utils/generateOtp.js";
import { Complaint } from "../models/Complaint.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Generates and stores hashed 4-digit resolution OTP with 48h expiry
 * @param {string} complaintId 
 * @returns {Promise<string>} raw OTP (used ONLY for email/notification, not stored in plaintext)
 */
export const createResolutionOtp = async (complaintId) => {
  const rawOtp = generateSecureOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await Complaint.findByIdAndUpdate(complaintId, {
    "resolution.otpHash": hashedOtp,
    "resolution.otpExpiresAt": expiresAt,
    "resolution.otpAttempts": 0
  });

  return rawOtp;
};

/**
 * Validates candidate OTP against hashed OTP on complaint
 * Enforces 48h expiration and max 5 attempts lockout
 */
export const verifyResolutionOtp = async (complaintId, candidateOtp) => {
  const complaint = await Complaint.findById(complaintId).select("+resolution.otpHash");
  if (!complaint) {
    throw new ApiError(404, "Complaint not found.");
  }

  if (!complaint.resolution?.otpHash) {
    throw new ApiError(400, "No active verification OTP found for this complaint.");
  }

  // Check 48h expiry
  if (Date.now() > new Date(complaint.resolution.otpExpiresAt).getTime()) {
    throw new ApiError(400, "Resolution OTP has expired. Please use the confirm & rate option.");
  }

  // Check attempts
  if ((complaint.resolution.otpAttempts || 0) >= 5) {
    throw new ApiError(
      429,
      "Maximum OTP verification attempts (5) exceeded. Please confirm manually with a rating or contact support."
    );
  }

  const isValid = verifyOtpHash(candidateOtp, complaint.resolution.otpHash);

  if (!isValid) {
    await Complaint.findByIdAndUpdate(complaintId, {
      $inc: { "resolution.otpAttempts": 1 }
    });
    const remaining = 5 - ((complaint.resolution.otpAttempts || 0) + 1);
    throw new ApiError(400, `Invalid OTP code. ${remaining} attempt(s) remaining.`);
  }

  return true;
};
