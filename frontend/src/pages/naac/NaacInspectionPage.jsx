import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Loader2,
  MapPin,
  Search,
  Shield,
  User,
  Building,
  ArrowRight,
  ClipboardCheck,
  Calendar,
  Sparkles,
  X
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";

export const NaacInspectionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalSevere: 0,
    pendingInspection: 0,
    inspected: 0,
    actionConfirmed: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspection Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectorName, setInspectorName] = useState(user?.name || "Dr. K. Radhakrishnan");
  const [inspectorDesignation, setInspectorDesignation] = useState("NAAC Peer Reviewer & IQAC Head");
  const [inspectionFindings, setInspectionFindings] = useState("");
  const [verifiedSeverity, setVerifiedSeverity] = useState("Severe Hazard");
  const [submittingInspection, setSubmittingInspection] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchSevereComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await api.get(`/complaints/naac/severe?${params.toString()}`);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load severe complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchSevereComplaints();
  }, [fetchSevereComplaints]);

  const handleOpenInspectModal = (complaint) => {
    setSelectedComplaint(complaint);
    setInspectorName(user?.name || "Dr. K. Radhakrishnan");
    setInspectorDesignation("NAAC Peer Reviewer & IQAC Head");
    setInspectionFindings(complaint.naacReview?.inspectionFindings || "");
    setVerifiedSeverity(complaint.naacReview?.verifiedSeverity || "Severe Hazard");
    setActionError("");
    setInspectModalOpen(true);
  };

  const handleSaveInspection = async (e) => {
    e.preventDefault();
    if (!inspectionFindings.trim()) {
      setActionError("Inspection findings and observation notes are required.");
      return;
    }

    try {
      setSubmittingInspection(true);
      setActionError("");
      const res = await api.post(`/complaints/${selectedComplaint._id}/naac-inspect`, {
        inspectorName,
        inspectorDesignation,
        inspectionFindings,
        verifiedSeverity
      });

      if (res.data?.success) {
        setInspectModalOpen(false);
        fetchSevereComplaints();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to log NAAC inspection visit.");
    } finally {
      setSubmittingInspection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <Award className="w-3.5 h-3.5" />
            <span>National Assessment and Accreditation Council (NAAC) &amp; IQAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Severe Grievance Inspection &amp; Action Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Institutional inspection oversight for critical safety hazards, infrastructure breakdowns, and severe student grievances. Conduct on-site inspections and confirm official compliance action orders.
          </p>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Severe Tickets</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900">{stats.totalSevere}</div>
          <p className="text-[11px] text-neutral-500">High &amp; Emergency safety priority</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Visit</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pendingInspection}</div>
          <p className="text-[11px] text-neutral-500">Awaiting NAAC on-site inspection</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inspected</span>
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.inspected}</div>
          <p className="text-[11px] text-neutral-500">Findings logged, action ready</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Action Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.actionConfirmed}</div>
          <p className="text-[11px] text-neutral-500">Official Action Slip issued</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === "all"
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All Severe ({stats.totalSevere})
          </button>
          <button
            onClick={() => setStatusFilter("pending_inspection")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === "pending_inspection"
                ? "bg-amber-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Needs Visit ({stats.pendingInspection})
          </button>
          <button
            onClick={() => setStatusFilter("inspected")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === "inspected"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Inspected ({stats.inspected})
          </button>
          <button
            onClick={() => setStatusFilter("action_confirmed")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === "action_confirmed"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Confirmed ({stats.actionConfirmed})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets, rooms..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 focus:outline-none focus:border-black transition"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
          <span className="text-xs">Loading severe complaints dossier...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 space-y-2">
          <Award className="w-8 h-8 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800">No severe complaints found</h3>
          <p className="text-xs text-neutral-500">
            {statusFilter !== "all"
              ? "No tickets match the selected NAAC inspection status filter."
              : "No severe or critical safety grievances are currently pending in the system."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {complaints.map((c) => {
            const naacStatus = c.naacReview?.inspectionStatus || "none";
            const isActionConfirmed = naacStatus === "action_confirmed";
            const isInspected = naacStatus === "inspected";

            return (
              <div
                key={c._id}
                className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 shadow-sm transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-neutral-900 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                      {c.ticketId}
                    </span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />

                    {/* NAAC Status Badge */}
                    {isActionConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        NAAC Action Confirmed ({c.naacReview?.actionConfirmationSlipId})
                      </span>
                    ) : isInspected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
                        <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                        NAAC Inspected - Action Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Requires On-Site NAAC Visit
                      </span>
                    )}

                    {/* 3-Day Inaction Badge */}
                    {(c.sla?.escalationLevel >= 3 || c.naacReview?.breach3Days || (c.createdAt && Date.now() - new Date(c.createdAt).getTime() >= 3 * 24 * 3600 * 1000)) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                        🚨 &gt;3 Days Inaction - Disciplinary Oversight
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-neutral-400">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-neutral-950">{c.title}</h3>
                  <p className="text-xs text-neutral-600 line-clamp-2">{c.description}</p>
                </div>

                {/* Location and Personnel Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-neutral-50 text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{c.location?.fullPath}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      Student: {c.isAnonymous ? "Anonymous" : c.studentName || c.createdBy?.name || "Student"}
                      {c.studentDept && ` (${c.studentDept})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      Dept: {c.department?.name || "General"}
                    </span>
                  </div>
                </div>

                {/* If Inspected or Action Confirmed: Display Findings Card */}
                {c.naacReview?.inspectionFindings && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>NAAC Visit Observation ({c.naacReview?.inspectorName})</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-normal">
                        {c.naacReview?.inspectedAt
                          ? new Date(c.naacReview.inspectedAt).toLocaleString()
                          : "Inspected"}
                      </span>
                    </div>
                    <p className="text-neutral-800 text-xs">{c.naacReview.inspectionFindings}</p>
                    {c.naacReview.actionType && (
                      <div className="pt-1.5 mt-1 border-t border-amber-200/60 flex items-center gap-2">
                        <span className="font-bold text-amber-950">Action Directive:</span>
                        <span className="text-neutral-800">{c.naacReview.actionType}</span>
                        <span className="ml-auto px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Grade {c.naacReview.complianceGrade || "A+"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex items-center justify-between pt-2">
                  <Link
                    to={`/complaints/${c._id}`}
                    className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Ticket
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Button 1: Log Inspection Visit */}
                    <button
                      type="button"
                      onClick={() => handleOpenInspectModal(c)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isInspected || isActionConfirmed ? "Re-Inspect / Edit" : "Conduct Visit"}</span>
                    </button>

                    {/* Button 2: Go to NAAC Action Confirm Page */}
                    <Link
                      to={`/complaints/${c._id}/naac-confirm`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{isActionConfirmed ? "View Action Slip" : "Confirm NAAC Action"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* On-Site Inspection Visit Modal */}
      {inspectModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Log NAAC On-Site Inspection Visit
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Ticket: {selectedComplaint.ticketId} • {selectedComplaint.location?.room}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveInspection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Inspector Name *
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={inspectorDesignation}
                    onChange={(e) => setInspectorDesignation(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Verified Severity Assessment
                </label>
                <select
                  value={verifiedSeverity}
                  onChange={(e) => setVerifiedSeverity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black bg-white"
                >
                  <option value="Critical Infrastructure Failure">Critical Infrastructure Failure</option>
                  <option value="Severe Hazard">Severe Hazard (Electrical / Water)</option>
                  <option value="High Risk Safety Issue">High Risk Safety Issue</option>
                  <option value="Moderate Severity">Moderate Severity</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Physical Inspection Findings &amp; Observations *
                </label>
                <textarea
                  rows={4}
                  value={inspectionFindings}
                  onChange={(e) => setInspectionFindings(e.target.value)}
                  placeholder="Detail the on-site visit observations, condition of facility, potential hazard to students, and urgency of rectification..."
                  required
                  className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInspection}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-neutral-800 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingInspection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Inspection Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
