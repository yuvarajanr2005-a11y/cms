import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import api from "../api/axios";

export const ReopenModal = ({ isOpen, onClose, complaintId, ticketId, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a descriptive reason (at least 5 characters) for reopening.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/complaints/${complaintId}/reopen`, { reason: reason.trim() });
      if (res.data?.success) {
        onSuccess && onSuccess(res.data.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reopen complaint.");
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

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 border border-orange-200">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Reopen Ticket</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Reopening will escalate ticket <span className="font-semibold text-neutral-800">{ticketId}</span> to the next priority tier and reset SLA timers.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Tickets can only be reopened within 48 hours of resolution. A reopen is recorded against the assigned technician's quality score.
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Reason for Dispute / Reopening *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the resolution was incomplete or recurred..."
              rows={4}
              required
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
              Submit Reopen Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
