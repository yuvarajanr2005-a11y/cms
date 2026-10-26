import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Inbox,
  QrCode,
  Sparkles,
  Upload,
  X,
  MapPin,
  Building,
  GraduationCap,
  User as UserIcon,
  Layers,
  DoorClosed,
  Send,
  Zap,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { SlaCountdown } from "../../components/SlaCountdown";
import { VerifyOtpModal } from "../../components/VerifyOtpModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ReopenModal } from "../../components/ReopenModal";
import { ProofModal } from "../../components/ProofModal";
import { QrScannerModal, playScanSuccessChime } from "../../components/QrScannerModal";

const COLLEGE_DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Electronics & Communication Engineering (ECE)",
  "Mechanical Engineering (MECH)",
  "Civil Engineering (CIVIL)",
  "Information Technology (IT)",
  "Electrical & Electronics Engineering (EEE)",
  "Hostel Resident / General Student"
];

const COMPLAINT_CATEGORIES = [
  { key: "electrical", label: "Electrical & Power", icon: Zap, color: "text-amber-500 bg-amber-50 border-amber-200" },
  { key: "plumbing", label: "Plumbing & Taps", icon: MapPin, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { key: "leakage", label: "Water Leakage", icon: AlertTriangle, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "food_mess", label: "Hostel Food & Mess", icon: Sparkles, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "wifi", label: "Campus WiFi / Net", icon: Sparkles, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { key: "academic", label: "Lab & Projector", icon: GraduationCap, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { key: "furniture", label: "Classroom Benches", icon: Building, color: "text-neutral-700 bg-neutral-100 border-neutral-300" },
  { key: "hostel", label: "Hostel Room Lock", icon: DoorClosed, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "cleaning", label: "Housekeeping", icon: Sparkles, color: "text-green-600 bg-green-50 border-green-200" },
  { key: "ragging", label: "Anti-Ragging Cell", icon: ShieldAlert, color: "text-red-700 bg-red-100 border-red-300 font-bold" },
  { key: "other", label: "Other Grievances", icon: PlusCircle, color: "text-neutral-600 bg-neutral-50 border-neutral-200" }
];

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Complaints list state
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [activeTicket, setActiveTicket] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Embedded Form State
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [studentName, setStudentName] = useState(user?.name || "Alex Johnson");
  const [studentDept, setStudentDept] = useState("Computer Science & Engineering (CSE)");
  const [locationsTree, setLocationsTree] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [category, setCategory] = useState("electrical");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSevere, setIsSevere] = useState(false);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const [isQrAutoFilled, setIsQrAutoFilled] = useState(false);

  const fileInputRef = useRef(null);

  // Update default student name when user loads
  useEffect(() => {
    if (user?.name) {
      setStudentName(user.name);
    }
  }, [user]);

  // Load campus locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/complaints/locations");
        if (res.data?.success) {
          const list = res.data.data.locations || [];
          setLocationsTree(list);
          if (list.length > 0) {
            setSelectedBlock(list[0].block);
            if (list[0].floors?.length > 0) {
              setSelectedFloor(list[0].floors[0].floor);
              if (list[0].floors[0].rooms?.length > 0) {
                setSelectedRoom(list[0].floors[0].rooms[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Locations fetch error:", err);
      }
    };
    fetchLocations();
  }, []);

  const currentBlockData = locationsTree.find((b) => b.block === selectedBlock);
  const availableFloors = currentBlockData?.floors || [];
  const currentFloorData = availableFloors.find((f) => f.floor === selectedFloor);
  const availableRooms = currentFloorData?.rooms || [];

  const handleBlockChange = (blockName) => {
    setSelectedBlock(blockName);
    setIsQrAutoFilled(false);
    const bObj = locationsTree.find((b) => b.block === blockName);
    if (bObj?.floors?.length > 0) {
      setSelectedFloor(bObj.floors[0].floor);
      if (bObj.floors[0].rooms?.length > 0) {
        setSelectedRoom(bObj.floors[0].rooms[0]);
      }
    }
  };

  const handleFloorChange = (floorName) => {
    setSelectedFloor(floorName);
    setIsQrAutoFilled(false);
    const fObj = availableFloors.find((f) => f.floor === floorName);
    if (fObj?.rooms?.length > 0) {
      setSelectedRoom(fObj.rooms[0]);
    }
  };

  const handleScannedQrLocation = (data) => {
    if (data.block) {
      setSelectedBlock(data.block);
      setIsQrAutoFilled(true);
      if (data.floor) setSelectedFloor(data.floor);
      if (data.room) setSelectedRoom(data.room);
      if (data.category && COMPLAINT_CATEGORIES.some((c) => c.key === data.category)) {
        setCategory(data.category);
      }
      if (data.asset) {
        setTitle(`Issue with ${data.asset}`);
      }
      setShowQrModal(false);
    }
  };

  // Handle Photo selection
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const newFiles = [...files, ...selected].slice(0, 3);
    setFiles(newFiles);

    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const removeFile = (idx) => {
    const updatedFiles = files.filter((_, i) => i !== idx);
    setFiles(updatedFiles);
    const updatedPreviews = filePreviews.filter((_, i) => i !== idx);
    setFilePreviews(updatedPreviews);
  };

  // Fetch Complaints
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

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchComplaints();

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

  // Handle Form Submission
  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("block", selectedBlock);
      formData.append("floor", selectedFloor);
      formData.append("room", selectedRoom);
      formData.append("studentName", studentName.trim());
      formData.append("studentDept", studentDept);
      formData.append("isAnonymous", isAnonymous ? "true" : "false");
      formData.append("isSevere", isSevere ? "true" : "false");

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        playScanSuccessChime();
        const createdTicket = res.data.data.complaint;
        setSubmissionFeedback({
          type: "success",
          ticketId: createdTicket.ticketId,
          title: createdTicket.title,
          message: `Grievance #${createdTicket.ticketId} successfully registered and dispatched to Head of Department (HOD) for immediate assignment & resolution.`
        });

        // Reset inputs
        setTitle("");
        setDescription("");
        setFiles([]);
        setFilePreviews([]);
        setIsQrAutoFilled(false);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Refresh active list
        fetchComplaints();
      }
    } catch (err) {
      setSubmissionFeedback({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to submit grievance. Please verify all details."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-800 text-xs font-bold mb-1 border border-emerald-300">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Logged in as: {user?.name || "College Student"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Student Grievance &amp; Redressal Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Lodge campus grievances directly, track real-time resolution SLAs, and verify technician work.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neutral-900 to-indigo-950 hover:from-black hover:to-neutral-900 text-white text-xs font-bold shadow-sm transition border border-white/10"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Scan Room QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{isFormOpen ? "Hide Grievance Form" : "Lodge Grievance Directly"}</span>
          </button>
        </div>
      </div>

      {/* Embedded Grievance Form Card */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-neutral-900 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-amber-400 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">
                  Lodge Instant Grievance / உடனடி புகார் பதிவு
                </h2>
                <p className="text-xs text-neutral-500">
                  Fill details below. Automatically dispatched to the Head of Department (HOD) with live SLA countdown.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full self-start sm:self-auto">
              ⚡ HOD Direct Routing
            </span>
          </div>

          {/* Feedback Banner */}
          {submissionFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-start gap-3 border animate-in fade-in duration-200 ${
                submissionFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                  : "bg-rose-50 text-rose-900 border-rose-300"
              }`}
            >
              {submissionFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">
                  {submissionFeedback.type === "success" ? "Notification: Grievance Dispatched!" : "Submission Notice"}
                </p>
                <p className="mt-0.5 leading-relaxed">{submissionFeedback.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionFeedback(null)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleLodgeComplaint} className="space-y-5">
            {/* 1. Student Identity Section */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-neutral-900" />
                <span>Student Identity &amp; Academic Department</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    placeholder="e.g. Alex Johnson"
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Student Department *</label>
                  <select
                    value={studentDept}
                    onChange={(e) => setStudentDept(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none"
                  >
                    {COLLEGE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Campus Location Hierarchy */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-900" />
                  <span>Campus Location Coordinates *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-lg text-[11px] font-bold hover:bg-neutral-800 transition shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan Room QR</span>
                </button>
              </div>

              {isQrAutoFilled && (
                <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <span className="font-bold">
                    📍 Auto-detected via Room QR Code: {selectedBlock} • {selectedFloor} • {selectedRoom}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQrAutoFilled(false)}
                    className="underline text-[11px] text-emerald-700 hover:text-emerald-950 font-bold"
                  >
                    Edit
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Block / Building</label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-semibold"
                  >
                    {locationsTree.map((b) => (
                      <option key={b.block} value={b.block}>
                        {b.block}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Floor Level</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-semibold"
                  >
                    {availableFloors.map((f) => (
                      <option key={f.floor} value={f.floor}>
                        {f.floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Room / Lab Area</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setIsQrAutoFilled(false);
                    }}
                    className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-semibold"
                  >
                    {availableRooms.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Category Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-2">
                Problem Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {COMPLAINT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setCategory(cat.key);
                        if (["ragging", "misuse", "electrical", "leakage"].includes(cat.key)) {
                          setIsSevere(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        isSelected
                          ? "bg-black text-white border-black shadow-md ring-2 ring-black/20"
                          : `bg-white hover:bg-neutral-50 ${cat.color} text-neutral-800`
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Problem Title & Declaration */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Problem Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ceiling Fan #2 Sparking / Switch Board Burning Smell"
                  required
                  minLength={5}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Problem Declaration &amp; Detailed Description *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the exact nature of the fault, location inside room, and safety hazard..."
                  required
                  minLength={10}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>

            {/* 5. Photo Attachment with Preview */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                <span>Attach Problem Photo / Evidence (Optional, Max 3)</span>
                <span className="text-[11px] text-neutral-400 font-normal">PNG, JPG, Camera photo</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl border-2 border-dashed border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-700 transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {filePreviews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-neutral-300 group shadow-xs">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Anonymous Toggle & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-neutral-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <span>Submit Anonymously (Identity hidden from public queues)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-6 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching to HOD...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Submit &amp; Notify HOD</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

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
            <span>Resolved &amp; Closed</span>
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
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              statusFilter === tab.value
                ? "bg-black text-white shadow-xs"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-200 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading grievances...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-200">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="font-bold text-neutral-600">No grievances found</p>
            <p className="mt-0.5">Use the form above to lodge your maintenance ticket directly.</p>
          </div>
        ) : (
          complaints.map((ticket) => {
            const isPendingVerification = ticket.status === "pending_verification";
            const isClosed = ticket.status === "closed";
            const canReopen =
              isClosed &&
              ticket.resolution?.resolvedAt &&
              Date.now() - new Date(ticket.resolution.resolvedAt).getTime() <= 48 * 60 * 60 * 1000;

            const is3DaysBreach =
              ticket.sla?.escalationLevel >= 3 ||
              (ticket.createdAt &&
                Date.now() - new Date(ticket.createdAt).getTime() >= 3 * 24 * 60 * 60 * 1000 &&
                !["closed", "pending_verification"].includes(ticket.status));

            return (
              <div
                key={ticket._id}
                className={`p-5 rounded-2xl bg-white border transition shadow-xs hover:shadow-md space-y-3 ${
                  is3DaysBreach
                    ? "border-red-300 bg-red-50/20"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                      {ticket.ticketId}
                    </span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {is3DaysBreach && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        🚨 &gt;3 Days: NAAC Escalated
                      </span>
                    )}
                  </div>

                  <SlaCountdown
                    dueAt={ticket.sla?.dueAt}
                    breached={ticket.sla?.breached}
                    status={ticket.status}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                    {ticket.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
                  <div className="flex items-center gap-3 text-neutral-500 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-neutral-700">
                      <MapPin className="w-3.5 h-3.5" />
                      {ticket.location?.fullPath}
                    </span>
                    {ticket.studentDept && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {ticket.studentDept}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPendingVerification && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTicket(ticket);
                            setShowOtpModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Enter OTP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTicket(ticket);
                            setShowProofModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[11px] font-semibold transition"
                        >
                          View Work Proof
                        </button>
                      </>
                    )}

                    {canReopen && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTicket(ticket);
                          setShowReopenModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <Link
                      to={`/complaints/${ticket._id}`}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Track Status</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScannedLocation={handleScannedQrLocation}
      />

      {/* Verification Modals */}
      {activeTicket && (
        <>
          <VerifyOtpModal
            isOpen={showOtpModal}
            onClose={() => {
              setShowOtpModal(false);
              setActiveTicket(null);
            }}
            complaintId={activeTicket._id}
            onVerified={fetchComplaints}
          />

          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setActiveTicket(null);
            }}
            complaintId={activeTicket._id}
            onConfirmed={fetchComplaints}
          />

          <ReopenModal
            isOpen={showReopenModal}
            onClose={() => {
              setShowReopenModal(false);
              setActiveTicket(null);
            }}
            complaintId={activeTicket._id}
            onReopened={fetchComplaints}
          />

          <ProofModal
            isOpen={showProofModal}
            onClose={() => {
              setShowProofModal(false);
              setActiveTicket(null);
            }}
            photoUrl={activeTicket.resolution?.proofPhoto?.url}
            notes={activeTicket.resolution?.notes}
          />
        </>
      )}
    </div>
  );
};
