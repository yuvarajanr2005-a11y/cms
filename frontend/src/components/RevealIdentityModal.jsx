import React, { useState } from "react";
import { X, ShieldAlert, Eye, Loader2, User, Mail, Phone } from "lucide-react";
import api from "../api/axios";

export const RevealIdentityModal = ({ isOpen, onClose, complaint, onRevealed }) => {
  const [loading, setLoading] = useState(false);
  const [revealedData, setRevealedData] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen || !complaint) return null;

  const handleReveal = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/admin/complaints/${complaint._id}/reveal-identity`);
      if (res.data?.success) {
        setRevealedData(res.data.data.revealedIdentity || res.data.data.creator);
        onRevealed && onRevealed(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reveal author identity.");
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Reveal Anonymous Identity</h3>
            <p className="text-xs text-neutral-500">
              Ticket: <span className="font-semibold text-neutral-800">{complaint.ticketId}</span>
            </p>
          </div>
        </div>

        {!revealedData ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
              <p className="font-semibold">⚠️ Administrative Audit Warning</p>
              <p>
                This ticket was registered anonymously. Revealing the student's true identity is strictly logged in the immutable Audit Trail with your administrator credentials and timestamp.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReveal}
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Eye className="w-3.5 h-3.5" />
                I Understand, Reveal Author
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-700">
                <User className="w-4 h-4 text-neutral-900" />
                <span className="font-bold text-neutral-900">{revealedData.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-700">
                <Mail className="w-4 h-4 text-neutral-900" />
                <span>{revealedData.email}</span>
              </div>
              {revealedData.phone && (
                <div className="flex items-center gap-2 text-xs text-neutral-700">
                  <Phone className="w-4 h-4 text-neutral-900" />
                  <span>{revealedData.phone}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-emerald-700 text-center font-semibold">
              ✓ Action recorded in system audit logs.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
