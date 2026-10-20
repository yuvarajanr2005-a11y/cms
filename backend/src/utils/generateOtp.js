import crypto from "crypto";

/**
 * Generates a cryptographically secure 4-digit OTP
 * @returns {string} 4-digit numeric OTP
 */
export const generateSecureOtp = () => {
  // Generates integer between 1000 and 9999 inclusive
  const otpNumber = crypto.randomInt(1000, 10000);
  return otpNumber.toString();
};

/**
 * Hashes an OTP using SHA-256 for secure DB persistence
 * @param {string} otp 
 * @returns {string} SHA-256 hex digest
 */
export const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp.toString().trim()).digest("hex");
};

/**
 * Verifies if a raw OTP matches the stored hash
 * @param {string} rawOtp 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export const verifyOtpHash = (rawOtp, storedHash) => {
  if (!rawOtp || !storedHash) return false;
  const hash = hashOtp(rawOtp);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
};
