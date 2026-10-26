import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Building,
  AlertTriangle,
  FileCheck2,
  Printer,
  Share2,
  Loader2,
  ShieldCheck,
  Zap,
  Stamp,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";

export const NaacActionConfirmPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const slipRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form Fields
  const [actionType, setActionType] = useState("Immediate Rectification Directive (Strict 4-Hour SLA)");
  const [actionDetails, setActionDetails] = useState("");
  const [complianceGrade, setComplianceGrade] = useState("A+");
  const [directiveSlaHours, setDirectiveSlaHours] = useState(4);
  const [inspectorName, setInspectorName] = useState(user?.name || "Dr. K. Radhakrishnan");
  const [submitting, setSubmitting] = useState(false);
  const [actionConfirmed, setActionConfirmed] = useState(false);
  const [confirmedSlip, setConfirmedSlip] = useState(null);

  const fetchComplaintDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/complaints/${id}`);
      if (res.data?.success) {
        const c = res.data.data.complaint;
        setComplaint(c);
        if (c.naacReview?.inspectionStatus === "action_confirmed") {
          setActionConfirmed(true);
          // Try fetching official slip
          try {
            const slipRes = await api.get(`/complaints/${id}/naac-action-slip`);
            if (slipRes.data?.success) {
              setConfirmedSlip(slipRes.data.data.slip);
            }
          } catch (_) {}
        }

        // Set sensible defaults based on complaint
        if (!actionDetails && c.naacReview?.inspectionFindings) {
          setActionDetails(
            `Pursuant to NAAC on-site inspection findings, ordered immediate corrective overhaul of ${c.location?.room}. Facilities Department must resolve the hazard within 4 hours. Daily compliance report required.`
          );
        } else if (!actionDetails) {
          setActionDetails(
            `Immediate administrative directive issued to rectify ${c.title} at ${c.location?.fullPath}. High safety compliance protocol invoked under NAAC Criterion V standards.`
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaint dossier.");
    } finally {
      setLoading(false);
    }
  }, [id, actionDetails]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionDetails.trim()) {
      alert("Please provide the specific NAAC action directive and orders.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/complaints/${id}/naac-action-confirm`, {
        actionType,
        actionDetails,
        complianceGrade,
        directiveSlaHours,
        inspectorName
      });

      if (res.data?.success) {
        setActionConfirmed(true);
        setConfirmedSlip(res.data.data.confirmationSlip);
        // Refresh complaint data
        fetchComplaintDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm NAAC action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
        <span className="text-xs">Loading severe grievance confirmation dossier...</span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-red-600">{error || "Complaint not found."}</p>
        <Link
          to="/naac/inspection"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-900 font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to NAAC Inspection Desk
        </Link>
      </div>
    );
  }

  const isInspected = complaint.naacReview?.inspectionStatus === "inspected" || complaint.naacReview?.inspectionStatus === "action_confirmed";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link to="/naac/inspection" className="hover:text-black transition">
            NAAC Inspection Desk
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-mono text-neutral-900 font-bold">{complaint.ticketId}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-amber-800 font-semibold">Action Confirmation</span>
        </div>

        <Link
          to={`/complaints/${complaint._id}`}
          className="text-xs text-neutral-600 hover:text-black font-semibold flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Standard Ticket
        </Link>
      </div>

      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-neutral-950 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>NAAC Committee Grievance Redressal Cell</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Severe Grievance Action Confirmation Page
          </h1>
          <p className="text-xs text-slate-300">
            Smart College of Engineering &amp; Technology • Autonomous Institutional Redressal
          </p>
        </div>

        {actionConfirmed && (
          <button
            type="button"
            onClick={handlePrintSlip}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Slip</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left = Dossier & Inspection / Right = Action Console & Slip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint & On-Site Inspection Report */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Ticket Details */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="font-mono text-xs font-black text-neutral-900 px-2.5 py-1 rounded bg-neutral-100 border border-neutral-200">
                {complaint.ticketId}
              </span>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-neutral-950">{complaint.title}</h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{complaint.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
              <div className="flex items-start gap-2 text-neutral-600">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span className="font-medium text-neutral-900">{complaint.location?.fullPath}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  Student: {complaint.isAnonymous ? "Anonymous Student" : complaint.createdBy?.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Department: {complaint.department?.name || "General Maintenance"}</span>
              </div>
            </div>

            {/* Photo Attachments if any */}
            {complaint.attachments?.length > 0 && (
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                  Student Photographic Evidence ({complaint.attachments.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {complaint.attachments.map((att, i) => (
                    <img
                      key={i}
                      src={att.url}
                      alt="Complaint attachment"
                      className="w-full h-24 object-cover rounded-xl border border-neutral-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: On-Site Inspection Findings Report */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <Award className="w-4 h-4 text-amber-700" />
                <span>On-Site NAAC Inspection Report</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-bold">
                {complaint.naacReview?.verifiedSeverity || "Severe Hazard"}
              </span>
            </div>

            {isInspected ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                  <span>Inspector: {complaint.naacReview?.inspectorName}</span>
                  <span>
                    {complaint.naacReview?.inspectedAt
                      ? new Date(complaint.naacReview.inspectedAt).toLocaleString()
                      : "Recently Inspected"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/90 border border-amber-200/80 text-neutral-800 leading-relaxed text-xs">
                  {complaint.naacReview?.inspectionFindings}
                </div>
                <div className="text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Physical campus presence verified by NAAC peer reviewer.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/70 border border-amber-200 text-xs text-amber-900 text-center space-y-1">
                <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="font-bold">Initial On-Site Inspection Pending</p>
                <p className="text-[11px] text-neutral-600">
                  You can proceed to confirm executive action directly, or log findings first in the inspection desk.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Action Confirmation Console & Official Slip */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action Form Card (if not yet confirmed or if editing) */}
          {!actionConfirmed ? (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      NAAC Official Action Order &amp; Directives
                    </h2>
                    <p className="text-[11px] text-neutral-500">
                      Executive sanction, compliance rating, and immediate resolution instructions
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Step 2: Confirm Action
                </span>
              </div>

              <form onSubmit={handleConfirmAction} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Official NAAC Action Type *
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-black bg-white font-medium"
                  >
                    <option value="Immediate Rectification Directive (Strict 4-Hour SLA)">
                      Immediate Rectification Directive (Strict 4-Hour SLA)
                    </option>
                    <option value="Emergency Budget Sanction & Alternative Facility Provision">
                      Emergency Budget Sanction &amp; Alternative Facility Provision
                    </option>
                    <option value="Administrative Inquiry & Contractor Replacement Penalty">
                      Administrative Inquiry &amp; Contractor Replacement Penalty
                    </option>
                    <option value="Hazard Sealed & Student Relocation Order">
                      Hazard Sealed &amp; Student Relocation Order
                    </option>
                    <option value="Accreditation Quality Compliance Certified">
                      Accreditation Quality Compliance Certified
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Compliance Grade Rating
                    </label>
                    <select
                      value={complianceGrade}
                      onChange={(e) => setComplianceGrade(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-black bg-white font-medium"
                    >
                      <option value="A++">A++ (Exceptional Standard)</option>
                      <option value="A+">A+ (High Compliance)</option>
                      <option value="A">A (Standard Institutional)</option>
                      <option value="B++">B++ (Action Monitored)</option>
                      <option value="Critical Hazard Warning">Critical Hazard Warning</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Strict Resolution Due (Hours)
                    </label>
                    <select
                      value={directiveSlaHours}
                      onChange={(e) => setDirectiveSlaHours(Number(e.target.value))}
                      className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-black bg-white font-medium"
                    >
                      <option value={2}>2 Hours (Immediate Danger)</option>
                      <option value={4}>4 Hours (Standard Severe)</option>
                      <option value={8}>8 Hours (Same Day Overhaul)</option>
                      <option value={24}>24 Hours (Next Day Verification)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Executive Directive Orders &amp; Action Notes *
                  </label>
                  <textarea
                    rows={4}
                    value={actionDetails}
                    onChange={(e) => setActionDetails(e.target.value)}
                    placeholder="Provide specific instructions to the Maintenance Engineers, Department Head, and Warden..."
                    required
                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-black leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Authorizing Officer / Inspector Signature Name
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                  />
                </div>

                {/* Submit Action Confirmation Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Confirm NAAC Action Order</span>
                  </button>
                  <p className="text-[11px] text-center text-neutral-400 mt-2">
                    Generates official cryptographically registered confirmation slip in college accreditation records.
                  </p>
                </div>
              </form>
            </div>
          ) : (
            /* Action Confirmed Success Notification Banner */
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Official NAAC Action Confirmed &amp; Logged
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Slip ID: <span className="font-mono font-bold">{confirmedSlip?.slipId || complaint.naacReview?.actionConfirmationSlipId}</span> • Recorded in College Audit Trail
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionConfirmed(false)}
                className="text-xs text-emerald-800 font-bold hover:underline"
              >
                Modify Action
              </button>
            </div>
          )}

          {/* OFFICIAL NAAC ACTION CONFIRMATION SLIP PREVIEW */}
          <div
            ref={slipRef}
            className="p-6 sm:p-8 rounded-3xl bg-amber-50/40 border-2 border-amber-300/80 shadow-xl space-y-6 relative overflow-hidden"
            style={{
              backgroundImage: "radial-gradient(#f59e0b12 1px, transparent 1px)",
              backgroundSize: "16px 16px"
            }}
          >
            {/* Watermark Emblem */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
              <Award className="w-72 h-72 text-amber-950" />
            </div>

            {/* Slip Header */}
            <div className="text-center pb-4 border-b-2 border-amber-300 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-1">
                National Assessment and Accreditation Council • Autonomous Peer Review
              </div>
              <h2 className="text-lg sm:text-xl font-black text-amber-950 uppercase tracking-tight">
                Smart College of Engineering &amp; Technology
              </h2>
              <p className="text-xs font-semibold text-neutral-700">
                Institutional Quality Assurance Cell (IQAC) • Criterion V: Grievance Redressal
              </p>
              <p className="text-[11px] font-mono font-bold text-amber-900 tracking-wider">
                OFFICIAL SEVERE GRIEVANCE ACTION CONFIRMATION SLIP
              </p>
            </div>

            {/* Slip Reference Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/80 border border-amber-200">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Slip Number</span>
                <span className="font-mono font-black text-amber-900 text-xs">
                  {confirmedSlip?.slipId || complaint.naacReview?.actionConfirmationSlipId || "NAAC-ACT-2026-PENDING"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-amber-200">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Ticket ID</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">{complaint.ticketId}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-amber-200">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Compliance Grade</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {confirmedSlip?.complianceGrade || complaint.naacReview?.complianceGrade || complianceGrade}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-amber-200">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Action Date</span>
                <span className="font-medium text-neutral-800 text-xs">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Grievance Summary Box */}
            <div className="p-4 rounded-2xl bg-white/90 border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-neutral-900 pb-1 border-b border-neutral-100">
                <span>Grievance: {complaint.title}</span>
                <span className="capitalize text-amber-800">{complaint.category} Category</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                <div>
                  <span className="font-semibold text-neutral-900">Campus Location:</span>{" "}
                  {complaint.location?.fullPath}
                </div>
                <div>
                  <span className="font-semibold text-neutral-900">Aggrieved Student:</span>{" "}
                  {complaint.isAnonymous ? "Anonymous Student" : complaint.createdBy?.name}
                </div>
              </div>
              {complaint.naacReview?.inspectionFindings && (
                <div className="pt-1.5 border-t border-neutral-100 text-[11px]">
                  <span className="font-bold text-amber-950">On-Site Visit Report:</span>{" "}
                  <span className="text-neutral-700 italic">
                    "{complaint.naacReview.inspectionFindings}"
                  </span>
                </div>
              )}
            </div>

            {/* Official Directive Orders */}
            <div className="p-4 rounded-2xl bg-white/95 border-2 border-emerald-600/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Executive Action Directive Approved:</span>
              </div>
              <p className="font-bold text-neutral-950 text-xs">
                {confirmedSlip?.actionType || complaint.naacReview?.actionType || actionType}
              </p>
              <p className="text-xs text-neutral-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                {confirmedSlip?.actionDetails || complaint.naacReview?.actionDetails || actionDetails}
              </p>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-4 border-t-2 border-amber-300 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Authorizing Official</span>
                <span className="font-bold text-neutral-900">
                  {confirmedSlip?.confirmedByName || complaint.naacReview?.inspectorName || inspectorName}
                </span>
                <span className="text-[10px] text-neutral-500 block">NAAC Peer Reviewer &amp; IQAC Head</span>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 text-amber-800 flex flex-col items-center justify-center mx-auto text-[9px] font-black uppercase rotate-6">
                  <span>IQAC</span>
                  <span>VERIFIED</span>
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <span className="text-[9px] text-neutral-400 block mt-1 font-mono">DIGITAL AUTH 2026</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase block font-bold">Accreditation Cycle</span>
                <span className="font-bold text-neutral-900">NAAC Cycle 4 (Grade A++)</span>
                <span className="text-[10px] text-neutral-500 block">Autonomy Valid 2024-2029</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
