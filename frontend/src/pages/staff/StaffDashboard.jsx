import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  Eye,
  Inbox
} from "lucide-react";
import api from "../../api/axios";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { SlaCountdown } from "../../components/SlaCountdown";
import { ResolveModal } from "../../components/ResolveModal";
import { ProofModal } from "../../components/ProofModal";
import { useSocket } from "../../context/SocketContext";

export const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const { socket } = useSocket();

  // Resolve Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  const fetchAssignedComplaints = useCallback(async () => {
    try {
      const url = statusFilter
        ? `/staff/complaints?status=${statusFilter}`
        : "/staff/complaints";
      const res = await api.get(url);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints);
      }
    } catch (err) {
      console.error("Failed to load staff queue:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssignedComplaints();
  }, [fetchAssignedComplaints]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchAssignedComplaints();
    };

    socket.on("complaint:created", handleUpdate);
    socket.on("complaint:assigned", handleUpdate);
    socket.on("complaint:status_updated", handleUpdate);
    socket.on("complaint:escalated", handleUpdate);
    socket.on("complaint:reopened", handleUpdate);

    return () => {
      socket.off("complaint:created", handleUpdate);
      socket.off("complaint:assigned", handleUpdate);
      socket.off("complaint:status_updated", handleUpdate);
      socket.off("complaint:escalated", handleUpdate);
      socket.off("complaint:reopened", handleUpdate);
    };
  }, [socket, fetchAssignedComplaints]);

  const handleStartWork = async (complaintId) => {
    try {
      const res = await api.patch(`/staff/complaints/${complaintId}/status`, {
        status: "in_progress",
        note: "Staff arrived on location and commenced diagnostics/repairs."
      });
      if (res.data?.success) {
        fetchAssignedComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status to in progress.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-neutral-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Technician Work Queue
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tickets prioritized strictly by SLA deadline remaining. Mandatory photographic proof required upon resolution.
          </p>
        </div>

        <Link
          to="/staff/performance"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold border border-neutral-300 shadow-xs transition self-start sm:self-auto"
        >
          <span>View My Scorecard</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
        {[
          { label: "Active Queue", value: "" },
          { label: "Assigned", value: "assigned" },
          { label: "In Progress", value: "in_progress" },
          { label: "Escalated", value: "escalated" },
          { label: "Awaiting Verification", value: "pending_verification" }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
              statusFilter === tab.value
                ? "bg-black text-white border border-black shadow-xs"
                : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
          <span className="text-xs text-neutral-600">Loading assigned queue...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 space-y-2 shadow-sm">
          <Inbox className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-base font-semibold text-neutral-900">No active assigned tickets</h3>
          <p className="text-xs text-neutral-500">Your work queue is all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => {
            const isAssigned = item.status === "assigned" || item.status === "submitted" || item.status === "reopened";
            const isInProgress = item.status === "in_progress" || item.status === "escalated";
            const isPending = item.status === "pending_verification";

            return (
              <div
                key={item._id}
                className={`p-4 sm:p-5 rounded-2xl transition border ${
                  item.sla?.breached || item.status === "escalated"
                    ? "border-red-300 bg-red-50/30 shadow-sm"
                    : isPending
                    ? "border-neutral-300 bg-neutral-50/60 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300 bg-white shadow-xs"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-900">
                        {item.ticketId}
                      </span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      {!item.assignedTo && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                          Unassigned Dept Pool
                        </span>
                      )}
                      {item.sla?.breached && (
                        <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> SLA Breached
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span>📍 {item.location?.fullPath}</span>
                      <span>•</span>
                      <span>
                        Student: <strong className="text-neutral-900">{item.studentName || item.createdBy?.name || "Student"}</strong>
                        {item.studentDept && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-semibold">
                            {item.studentDept}
                          </span>
                        )}
                      </span>
                      {item.department?.name && <span>• Dept: {item.department.name}</span>}
                    </div>

                    {item.attachments && item.attachments.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-700 font-semibold">
                        <span>📸 {item.attachments.length} Problem Photo(s) Attached by Student</span>
                      </div>
                    )}

                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed pt-1">
                      {item.description}
                    </p>

                  </div>

                  {/* Actions & SLA urgency badge */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                      <SlaCountdown
                        dueAt={item.sla?.dueAt}
                        breached={item.sla?.breached}
                        status={item.status}
                      />
                    </div>

                    {isAssigned && !item.assignedTo && (
                      <button
                        onClick={() => handleStartWork(item._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Claim & Start</span>
                      </button>
                    )}

                    {isAssigned && item.assignedTo && (
                      <button
                        onClick={() => handleStartWork(item._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => {
                          setActiveTicket(item);
                          setShowResolveModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve with Photo Proof</span>
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={() => {
                          setActiveTicket(item);
                          setShowProofModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition flex items-center gap-1 border border-neutral-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-600" />
                        <span>View Proof</span>
                      </button>
                    )}

                    <Link
                      to={`/complaints/${item._id}`}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition border border-neutral-200"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Modal */}
      {activeTicket && (
        <>
          <ResolveModal
            isOpen={showResolveModal}
            onClose={() => setShowResolveModal(false)}
            complaint={activeTicket}
            onSuccess={fetchAssignedComplaints}
          />
          <ProofModal
            isOpen={showProofModal}
            onClose={() => setShowProofModal(false)}
            resolution={activeTicket.resolution}
            ticketId={activeTicket.ticketId}
          />
        </>
      )}
    </div>
  );
};
