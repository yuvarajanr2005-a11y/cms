import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  Eye,
  Loader2,
  AlertTriangle,
  History,
  Building
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { SlaCountdown } from "../../components/SlaCountdown";
import { UpvoteButton } from "../../components/UpvoteButton";
import { VerifyOtpModal } from "../../components/VerifyOtpModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ReopenModal } from "../../components/ReopenModal";
import { ProofModal } from "../../components/ProofModal";
import { StarRating } from "../../components/StarRating";
import { useSocket } from "../../context/SocketContext";

export const ComplaintDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { socket } = useSocket();

  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchComplaint = useCallback(async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      if (res.data?.success) {
        setComplaint(res.data.data.complaint);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaint.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchComplaint();
    };

    socket.on("complaint:status_updated", handleUpdate);
    socket.on("complaint:assigned", handleUpdate);
    socket.on("complaint:resolved", handleUpdate);
    socket.on("complaint:escalated", handleUpdate);
    socket.on("complaint:reopened", handleUpdate);
    socket.on("complaint:upvoted", handleUpdate);

    return () => {
      socket.off("complaint:status_updated", handleUpdate);
      socket.off("complaint:assigned", handleUpdate);
      socket.off("complaint:resolved", handleUpdate);
      socket.off("complaint:escalated", handleUpdate);
      socket.off("complaint:reopened", handleUpdate);
      socket.off("complaint:upvoted", handleUpdate);
    };
  }, [socket, fetchComplaint]);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
        <span className="text-xs">Loading complaint details...</span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-red-600">{error || "Complaint not found."}</p>
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-900 font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = user && (complaint.createdBy?._id === user._id || complaint.createdBy === user._id);
  const isPendingVerification = complaint.status === "pending_verification";
  const isClosed = complaint.status === "closed";
  const canReopen =
    isOwner &&
    (isPendingVerification ||
      (isClosed &&
        complaint.resolution?.resolvedAt &&
        Date.now() - new Date(complaint.resolution.resolvedAt).getTime() <= 48 * 60 * 60 * 1000));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <UpvoteButton
          complaintId={complaint._id}
          initialCount={complaint.upvoteCount}
          initialUpvoted={false}
          creatorId={complaint.createdBy}
        />
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-neutral-900">
              {complaint.ticketId}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isAnonymous && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                <Shield className="w-3 h-3 text-neutral-600" /> Anonymous
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200">
            <SlaCountdown
              dueAt={complaint.sla?.dueAt}
              breached={complaint.sla?.breached}
              status={complaint.status}
            />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          {complaint.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neutral-900" />
            <span>{complaint.location?.fullPath}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-neutral-700" />
            <span>Department: {complaint.department?.name || "General"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span>Logged: {new Date(complaint.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Dual Proof-of-Work Verification Alert Banner (if pending verification) */}
      {isPendingVerification && (
        <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-neutral-900" /> Work Completed - Awaiting Your Verification
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Staff has resolved this complaint with photo proof. Please check the work and enter your 4-digit code (sent via email) or confirm resolution directly.
              </p>
            </div>

            {complaint.resolution?.proofPhoto?.url && (
              <button
                onClick={() => setShowProofModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold shrink-0 flex items-center gap-1.5 border border-neutral-300 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-neutral-700" />
                <span>View Photo Proof</span>
              </button>
            )}
          </div>

          {isOwner && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200">
              <button
                onClick={() => setShowOtpModal(true)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter 4-Digit OTP</span>
              </button>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Rate Work</span>
              </button>

              <button
                onClick={() => setShowReopenModal(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Dispute & Reopen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Description & Details */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Description
        </h3>
        <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
          {complaint.description}
        </p>

        {/* Media Attachments */}
        {complaint.attachments?.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-neutral-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Attached Photographs ({complaint.attachments.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.attachments.map((att, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedImage(att.url)}
                  className="rounded-xl overflow-hidden border border-neutral-200 aspect-square bg-neutral-100 cursor-pointer hover:border-black transition group"
                >
                  <img
                    src={att.url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Details Card (if resolved or closed) */}
      {complaint.resolution?.resolvedAt && (
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Work Resolution Details
            </h3>
            {canReopen && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen (48h Window)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complaint.resolution.proofPhoto?.url && (
              <div
                onClick={() => setShowProofModal(true)}
                className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 cursor-pointer group relative max-h-48"
              >
                <img
                  src={complaint.resolution.proofPhoto.url}
                  alt="Proof"
                  className="w-full h-full object-cover group-hover:opacity-90 transition"
                />
                <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-xs rounded text-[10px] text-white flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View full proof
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 block font-medium">Technician Notes:</span>
                <p className="text-neutral-800 mt-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                  {complaint.resolution.notes || "None provided."}
                </p>
              </div>

              {complaint.resolution.rating && (
                <div>
                  <span className="text-neutral-500 block font-medium">Student Rating & Feedback:</span>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={complaint.resolution.rating} readOnly size="w-4 h-4" />
                    <span className="text-neutral-900 font-semibold">{complaint.resolution.rating} / 5</span>
                  </div>
                  {complaint.resolution.feedback && (
                    <p className="text-neutral-600 mt-1 italic">"{complaint.resolution.feedback}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Technician & Assignment Card */}
      <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center border border-neutral-200">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-neutral-500 block">Assigned Technician:</span>
            <span className="font-semibold text-neutral-900">
              {complaint.assignedTo ? complaint.assignedTo.name : "Unassigned (Awaiting Auto-Routing)"}
            </span>
          </div>
        </div>

        {complaint.assignedTo && (
          <span className="text-[11px] text-neutral-700 font-medium px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200">
            {complaint.assignedTo.staffType || "Staff"}
          </span>
        )}
      </div>

      {/* Status History & Audit Timeline */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
          <History className="w-4 h-4 text-neutral-900" /> Ticket Timeline & Status History
        </h3>

        <div className="space-y-4 relative pl-4 border-l border-neutral-200">
          {complaint.statusHistory?.map((hist, i) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-neutral-100" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={hist.status} />
                  <span className="text-[11px] text-neutral-500">
                    {new Date(hist.at).toLocaleString()}
                  </span>
                </div>
                {hist.note && (
                  <p className="text-xs text-neutral-600 leading-relaxed">{hist.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <img
            src={expandedImage}
            alt="Expanded Attachment"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Action Modals */}
      <VerifyOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        complaintId={complaint._id}
        ticketId={complaint.ticketId}
        onSuccess={fetchComplaint}
      />
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        complaintId={complaint._id}
        ticketId={complaint.ticketId}
        onSuccess={fetchComplaint}
      />
      <ReopenModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        complaintId={complaint._id}
        ticketId={complaint.ticketId}
        onSuccess={fetchComplaint}
      />
      <ProofModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        resolution={complaint.resolution}
        ticketId={complaint.ticketId}
      />
    </div>
  );
};
