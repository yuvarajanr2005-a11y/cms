import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Eye,
  Filter,
  Loader2,
  Inbox
} from "lucide-react";
import api from "../../api/axios";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { SlaCountdown } from "../../components/SlaCountdown";
import { VerifyOtpModal } from "../../components/VerifyOtpModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ReopenModal } from "../../components/ReopenModal";
import { ProofModal } from "../../components/ProofModal";
import { useSocket } from "../../context/SocketContext";

export const StudentDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const { socket } = useSocket();

  // Modals state
  const [activeTicket, setActiveTicket] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const url = statusFilter
        ? `/complaints/mine?status=${statusFilter}`
        : "/complaints/mine";
      const res = await api.get(url);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Real-time socket event updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchComplaints();
    };

    socket.on("complaint:created", handleUpdate);
    socket.on("complaint:status_updated", handleUpdate);
    socket.on("complaint:assigned", handleUpdate);
    socket.on("complaint:resolved", handleUpdate);
    socket.on("complaint:escalated", handleUpdate);

    return () => {
      socket.off("complaint:created", handleUpdate);
      socket.off("complaint:status_updated", handleUpdate);
      socket.off("complaint:assigned", handleUpdate);
      socket.off("complaint:resolved", handleUpdate);
      socket.off("complaint:escalated", handleUpdate);
    };
  }, [socket, fetchComplaints]);

  // Quick stats calculations
  const total = complaints.length;
  const inProgressCount = complaints.filter((c) =>
    ["submitted", "assigned", "in_progress", "escalated"].includes(c.status)
  ).length;
  const pendingVerificationCount = complaints.filter(
    (c) => c.status === "pending_verification"
  ).length;
  const closedCount = complaints.filter((c) => c.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Student Complaint Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track real-time resolution SLAs, verify technician work, and file new maintenance tickets.
          </p>
        </div>

        <Link
          to="/student/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File New Complaint</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Logged</span>
            <Inbox className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Active / In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/90 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-cyan-800 text-xs font-semibold">
            <span>Needs My Verification</span>
            <KeyRound className="w-4 h-4 text-cyan-600 animate-bounce" />
          </div>
          <p className="text-2xl font-bold text-cyan-900 mt-2">{pendingVerificationCount}</p>
          {pendingVerificationCount > 0 && (
            <span className="text-[10px] text-cyan-700 font-medium mt-1 block">
              OTP verification required
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{closedCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
        {[
          { label: "All Tickets", value: "" },
          { label: "Pending Verification", value: "pending_verification" },
          { label: "In Progress", value: "in_progress" },
          { label: "Escalated", value: "escalated" },
          { label: "Closed", value: "closed" }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
              statusFilter === tab.value
                ? "bg-black text-white shadow-sm"
                : "bg-white text-neutral-600 hover:text-black border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-black" />
          <span className="text-xs">Loading complaints...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 space-y-3 shadow-sm">
          <Inbox className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900">No complaints found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {statusFilter
              ? `No tickets currently matching status "${statusFilter}".`
              : "You have not filed any maintenance grievances yet. Click below to file your first complaint."}
          </p>
          <Link
            to="/student/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File a Complaint</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const isPendingVerification = c.status === "pending_verification";
            const isResolved = c.status === "closed";
            const canReopen =
              isPendingVerification ||
              (isResolved &&
                c.resolution?.resolvedAt &&
                Date.now() - new Date(c.resolution.resolvedAt).getTime() <= 48 * 60 * 60 * 1000);

            return (
              <div
                key={c._id}
                className={`p-4 sm:p-5 rounded-2xl transition border ${
                  isPendingVerification
                    ? "border-cyan-300 bg-cyan-50/20 shadow-sm"
                    : c.status === "escalated"
                    ? "border-rose-300 bg-rose-50/20 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 bg-white shadow-sm"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-900">
                        {c.ticketId}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <span className="text-xs text-neutral-300">•</span>
                      <span className="text-xs text-neutral-500 uppercase font-medium">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight truncate">
                      {c.title}
                    </h3>

                    <p className="text-xs text-neutral-500 truncate">
                      📍 {c.location?.fullPath}
                    </p>
                  </div>

                  {/* SLA and Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                      <SlaCountdown
                        dueAt={c.sla?.dueAt}
                        breached={c.sla?.breached}
                        status={c.status}
                      />
                    </div>

                    {/* View Proof Button if resolution exists */}
                    {c.resolution?.proofPhoto?.url && (
                      <button
                        onClick={() => {
                          setActiveTicket(c);
                          setShowProofModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition flex items-center gap-1 border border-neutral-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Proof</span>
                      </button>
                    )}

                    {/* Action buttons for pending verification */}
                    {isPendingVerification && (
                      <>
                        <button
                          onClick={() => {
                            setActiveTicket(c);
                            setShowOtpModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Verify OTP</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTicket(c);
                            setShowConfirmModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      </>
                    )}

                    {/* Reopen Action within 48h */}
                    {canReopen && (
                      <button
                        onClick={() => {
                          setActiveTicket(c);
                          setShowReopenModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <Link
                      to={`/complaints/${c._id}`}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeTicket && (
        <>
          <VerifyOtpModal
            isOpen={showOtpModal}
            onClose={() => setShowOtpModal(false)}
            complaintId={activeTicket._id}
            ticketId={activeTicket.ticketId}
            onSuccess={fetchComplaints}
          />
          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            complaintId={activeTicket._id}
            ticketId={activeTicket.ticketId}
            onSuccess={fetchComplaints}
          />
          <ReopenModal
            isOpen={showReopenModal}
            onClose={() => setShowReopenModal(false)}
            complaintId={activeTicket._id}
            ticketId={activeTicket.ticketId}
            onSuccess={fetchComplaints}
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
