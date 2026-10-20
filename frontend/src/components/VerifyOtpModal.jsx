import React, { useState } from "react";
import { X, KeyRound, Loader2, Star } from "lucide-react";
import api from "../api/axios";
import { StarRating } from "./StarRating";

export const VerifyOtpModal = ({ isOpen, onClose, complaintId, ticketId, onSuccess }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 4) {
      setError("Please enter the complete 4-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/complaints/${complaintId}/verify-otp`, {
        otp: fullOtp,
        rating,
        feedback
      });

      if (res.data?.success) {
        onSuccess && onSuccess(res.data.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto mb-3 border border-neutral-200">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Resolution Verification</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Enter the 4-digit verification code sent to your registered email for ticket <span className="font-semibold text-neutral-800">{ticketId}</span>.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-white border-2 border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" /> Rate the Resolution
              </label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share any comments on the repair quality..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Verify & Close Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
