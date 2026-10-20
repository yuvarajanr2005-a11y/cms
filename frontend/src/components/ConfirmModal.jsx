import React, { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import api from "../api/axios";
import { StarRating } from "./StarRating";

export const ConfirmModal = ({ isOpen, onClose, complaintId, ticketId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/complaints/${complaintId}/confirm`, {
        rating,
        feedback
      });

      if (res.data?.success) {
        onSuccess && onSuccess(res.data.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm resolution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Confirm Resolution</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Confirm that the maintenance work for ticket <span className="font-semibold text-neutral-800">{ticketId}</span> was completed satisfactorily.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2 text-center">
              Staff Performance Rating
            </label>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-center">
              <StarRating value={rating} onChange={setRating} size="w-7 h-7" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Review & Comments
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Prompt response and neat repair work..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
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
              Confirm & Rate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
