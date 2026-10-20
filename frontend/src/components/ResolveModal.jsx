import React, { useState } from "react";
import { X, CheckCircle, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import api from "../api/axios";

export const ResolveModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !complaint) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Proof photo must not exceed 5 MB.");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError("Proof of work photograph is mandatory to mark this ticket as resolved.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("proofPhoto", photo);
      formData.append("notes", notes);

      const res = await api.post(`/staff/complaints/${complaint._id}/resolve`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        onSuccess && onSuccess(res.data.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit resolution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Submit Work Resolution</h3>
            <p className="text-xs text-neutral-500">
              Ticket: <span className="font-semibold text-neutral-800">{complaint.ticketId}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Proof of Work Photo (Mandatory) *
            </label>
            <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-4 text-center bg-neutral-50 transition cursor-pointer relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-xl object-contain border border-neutral-200"
                  />
                  <p className="text-xs text-neutral-900 font-semibold">Click to choose a different photo</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-600 shadow-sm">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-neutral-700">
                    <span className="font-bold text-neutral-900">Upload proof photo</span> or drag & drop
                  </div>
                  <p className="text-[11px] text-neutral-400">JPG, PNG, or WEBP up to 5 MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Resolution Notes & Actions Taken *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what was fixed, parts replaced, or root cause..."
              rows={3}
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
              disabled={loading || !photo}
              className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Upload className="w-3.5 h-3.5" />
              Resolve & Send OTP to Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
