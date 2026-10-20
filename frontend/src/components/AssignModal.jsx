import React, { useState, useEffect } from "react";
import { X, UserCheck, Loader2 } from "lucide-react";
import api from "../api/axios";

export const AssignModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      setFetchingStaff(true);
      try {
        const res = await api.get("/admin/users?role=staff&limit=100");
        if (res.data?.success) {
          setStaffList(res.data.data.users);
          if (complaint?.assignedTo?._id) {
            setSelectedStaff(complaint.assignedTo._id);
          } else if (res.data.data.users.length > 0) {
            setSelectedStaff(res.data.data.users[0]._id);
          }
        }
      } catch (err) {
        setError("Failed to load staff list.");
      } finally {
        setFetchingStaff(false);
      }
    };

    fetchStaff();
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      setError("Please select a technician to assign.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.patch(`/admin/complaints/${complaint._id}/assign`, {
        assignedTo: selectedStaff,
        note
      });

      if (res.data?.success) {
        onSuccess && onSuccess(res.data.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign ticket.");
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Assign Ticket</h3>
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
              Select Staff / Technician *
            </label>
            {fetchingStaff ? (
              <div className="p-3 text-xs text-neutral-500 bg-neutral-50 rounded-xl flex items-center gap-2 border border-neutral-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading available staff...
              </div>
            ) : (
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                required
                className="w-full text-xs p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {staffList.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.staffType || "staff"}) - {st.department?.name || "General"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Assignment Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Please carry testing multimeter and check grounding..."
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
              disabled={loading || fetchingStaff}
              className="px-5 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
