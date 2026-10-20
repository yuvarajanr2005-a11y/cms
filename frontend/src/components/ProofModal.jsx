import React from "react";
import { X, CheckCircle, Calendar, User } from "lucide-react";

export const ProofModal = ({ isOpen, onClose, resolution, ticketId }) => {
  if (!isOpen || !resolution) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-900">Proof of Work: {ticketId}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {resolution.proofPhoto?.url ? (
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
              <img
                src={resolution.proofPhoto.url}
                alt="Resolution Proof"
                className="w-full max-h-80 object-contain bg-neutral-100"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-400 bg-neutral-50 rounded-xl border border-neutral-200">
              No photo proof provided.
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Work Notes from Staff
            </h4>
            <p className="text-sm text-neutral-800 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              {resolution.notes || "No notes provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>
                {resolution.resolvedAt
                  ? new Date(resolution.resolvedAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            {resolution.resolvedBy && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-400" />
                <span>Resolved by Staff</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition shadow-sm"
          >
            Close Proof
          </button>
        </div>
      </div>
    </div>
  );
};
