import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload,
  X,
  AlertCircle,
  ThumbsUp,
  MapPin,
  Shield,
  Loader2,
  CheckCircle2,
  Zap,
  Droplet,
  Wifi,
  Armchair,
  Paintbrush,
  Wrench,
  Sparkles,
  HelpCircle,
  Award,
  ShieldAlert,
  AlertTriangle,
  UtensilsCrossed,
  GraduationCap,
  Building,
  Bus,
  BookOpen,
  Trophy,
  QrCode
} from "lucide-react";
import { QrScannerModal } from "../../components/QrScannerModal";

import api from "../../api/axios";
import { UpvoteButton } from "../../components/UpvoteButton";
import { StatusBadge } from "../../components/StatusBadge";

export const COLLEGE_CATEGORIES = [
  {
    key: "ragging",
    label: "Anti-Ragging Squad",
    desc: "UGC Statutory Zero Tolerance & Apex Court Directives",
    icon: ShieldAlert,
    tag: "Zero Tolerance",
    tagColor: "bg-red-600 text-white",
    cardAccent: "border-red-300 hover:border-red-500 bg-red-50/40"
  },
  {
    key: "misuse",
    label: "Facility / Asset Misuse",
    desc: "Unauthorized lab access, asset damage or campus defacement",
    icon: AlertTriangle,
    tag: "Campus Discipline",
    tagColor: "bg-amber-600 text-white",
    cardAccent: "border-amber-300 hover:border-amber-500 bg-amber-50/40"
  },
  {
    key: "harassment",
    label: "Harassment & Grievances",
    desc: "Confidential disciplinary review & student safety",
    icon: ShieldAlert,
    tag: "Confidential",
    tagColor: "bg-rose-700 text-white",
    cardAccent: "border-rose-300 hover:border-rose-500 bg-rose-50/40"
  },
  {
    key: "food_mess",
    label: "Hostel Mess & Canteen",
    desc: "Food hygiene, catering quality, drinking water facilities",
    icon: UtensilsCrossed,
    tag: "Food & Health",
    tagColor: "bg-orange-600 text-white",
    cardAccent: "border-orange-200 hover:border-orange-400"
  },
  {
    key: "academic",
    label: "Academic & Lab Equipments",
    desc: "Lab setups, projectors, curriculum resources & equipment",
    icon: GraduationCap,
    tag: "Academic",
    tagColor: "bg-indigo-600 text-white",
    cardAccent: "border-indigo-200 hover:border-indigo-400"
  },
  {
    key: "electrical",
    label: "Electrical & Power Systems",
    desc: "Short circuits, wiring hazard, switchboard, fans, lights",
    icon: Zap,
    tag: "Hazard Safety",
    tagColor: "bg-yellow-600 text-white",
    cardAccent: "border-yellow-200 hover:border-yellow-400"
  },
  {
    key: "leakage",
    label: "Water Leakage & Flooding",
    desc: "Overhead tank overflow, pipe burst, roof seepage",
    icon: Droplet,
    tag: "Hazard Safety",
    tagColor: "bg-blue-600 text-white",
    cardAccent: "border-blue-200 hover:border-blue-400"
  },
  {
    key: "plumbing",
    label: "Plumbing & Restrooms",
    desc: "Taps, flush valves, washroom drainage & sanitation",
    icon: Wrench,
    tag: "Sanitation",
    tagColor: "bg-cyan-700 text-white",
    cardAccent: "border-cyan-200 hover:border-cyan-400"
  },
  {
    key: "hostel",
    label: "Hostel Maintenance & Rooms",
    desc: "Room locks, hostel wardens, bed allocation & amenities",
    icon: Building,
    tag: "Hostel Life",
    tagColor: "bg-purple-600 text-white",
    cardAccent: "border-purple-200 hover:border-purple-400"
  },
  {
    key: "transport",
    label: "College Bus & Transport",
    desc: "Bus timings, routes, pass verification & driver conduct",
    icon: Bus,
    tag: "Transport",
    tagColor: "bg-emerald-600 text-white",
    cardAccent: "border-emerald-200 hover:border-emerald-400"
  },
  {
    key: "wifi",
    label: "Campus WiFi & Network",
    desc: "Hostel/library WiFi, router issues, portal accessibility",
    icon: Wifi,
    tag: "IT & Network",
    tagColor: "bg-sky-600 text-white",
    cardAccent: "border-sky-200 hover:border-sky-400"
  },
  {
    key: "library",
    label: "Library & Digital Resources",
    desc: "Book checkout, digital journal access, study hall silence",
    icon: BookOpen,
    tag: "Library",
    tagColor: "bg-teal-600 text-white",
    cardAccent: "border-teal-200 hover:border-teal-400"
  },
  {
    key: "sports",
    label: "Sports Grounds & Equipment",
    desc: "Ground maintenance, court floodlights, gym machinery",
    icon: Trophy,
    tag: "Sports & Gym",
    tagColor: "bg-lime-700 text-white",
    cardAccent: "border-lime-200 hover:border-lime-400"
  },
  {
    key: "furniture",
    label: "Desks & Classroom Furniture",
    desc: "Benches, podiums, broken chairs, whiteboards",
    icon: Armchair,
    tag: "Infrastructure",
    tagColor: "bg-neutral-700 text-white",
    cardAccent: "border-neutral-200 hover:border-neutral-400"
  },
  {
    key: "cleaning",
    label: "Housekeeping & Cleanliness",
    desc: "Corridor sweeping, dustbins, hygiene maintenance",
    icon: Sparkles,
    tag: "Housekeeping",
    tagColor: "bg-green-700 text-white",
    cardAccent: "border-green-200 hover:border-green-400"
  },
  {
    key: "painting",
    label: "Painting & Infrastructure",
    desc: "Wall flaking, dampness repair, exterior campus paint",
    icon: Paintbrush,
    tag: "Civil Maintenance",
    tagColor: "bg-stone-600 text-white",
    cardAccent: "border-stone-200 hover:border-stone-400"
  },
  {
    key: "other",
    label: "Other College Complaints",
    desc: "General campus issues not covered in above categories",
    icon: HelpCircle,
    tag: "General",
    tagColor: "bg-neutral-600 text-white",
    cardAccent: "border-neutral-200 hover:border-neutral-400"
  }
];

const CATEGORY_ICONS = COLLEGE_CATEGORIES.reduce((acc, cur) => {
  acc[cur.key] = cur.icon;
  return acc;
}, {});

export const NewComplaint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // QR Auto-fill & Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrAutoFilled, setIsQrAutoFilled] = useState(false);

  // Location Cascading State
  const [locationsTree, setLocationsTree] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  // Form State
  const [category, setCategory] = useState("electrical");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSevere, setIsSevere] = useState(false);
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Similarity Search State
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [checkingSimilarity, setCheckingSimilarity] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle scanned data from QR modal
  const handleScannedLocation = (data) => {
    if (data.block) {
      setSelectedBlock(data.block);
      setIsQrAutoFilled(true);
      if (data.floor) setSelectedFloor(data.floor);
      if (data.room) setSelectedRoom(data.room);
      if (data.category && COLLEGE_CATEGORIES.some((c) => c.key === data.category)) {
        setCategory(data.category);
      }
      if (data.asset) {
        setTitle(`Issue with ${data.asset}`);
      }
      setShowQrModal(false);
    }
  };

  // Fetch cascading campus locations & parse QR parameters
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/complaints/locations");
        if (res.data?.success) {
          const list = res.data.data.locations || [];
          setLocationsTree(list);

          const paramBlock = searchParams.get("block");
          const paramFloor = searchParams.get("floor");
          const paramRoom = searchParams.get("room");
          const paramCategory = searchParams.get("category");
          const paramAsset = searchParams.get("asset");

          if (paramBlock) {
            setIsQrAutoFilled(true);
            setSelectedBlock(paramBlock);
            if (paramFloor) setSelectedFloor(paramFloor);
            if (paramRoom) setSelectedRoom(paramRoom);
            if (paramCategory && COLLEGE_CATEGORIES.some((c) => c.key === paramCategory)) {
              setCategory(paramCategory);
            }
            if (paramAsset) {
              setTitle(`Issue with ${paramAsset}`);
            }
          } else if (list.length > 0) {
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
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, [searchParams]);

  // Update available floors when block changes
  const currentBlockData = locationsTree.find((b) => b.block === selectedBlock);
  const availableFloors = currentBlockData?.floors || [];

  // Update available rooms when floor changes
  const currentFloorData = availableFloors.find((f) => f.floor === selectedFloor);
  const availableRooms = currentFloorData?.rooms || [];

  const handleBlockChange = (blockName) => {
    setSelectedBlock(blockName);
    const blockObj = locationsTree.find((b) => b.block === blockName);
    if (blockObj?.floors?.length > 0) {
      setSelectedFloor(blockObj.floors[0].floor);
      if (blockObj.floors[0].rooms?.length > 0) {
        setSelectedRoom(blockObj.floors[0].rooms[0]);
      }
    }
  };

  const handleFloorChange = (floorName) => {
    setSelectedFloor(floorName);
    const floorObj = availableFloors.find((f) => f.floor === floorName);
    if (floorObj?.rooms?.length > 0) {
      setSelectedRoom(floorObj.rooms[0]);
    }
  };

  // Debounced Similarity Search
  useEffect(() => {
    if (!title || title.trim().length < 4) {
      setSimilarComplaints([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSimilarity(true);
      try {
        const queryParams = new URLSearchParams({
          title: title.trim(),
          block: selectedBlock,
          floor: selectedFloor,
          room: selectedRoom
        });
        const res = await api.get(`/complaints/similar?${queryParams.toString()}`);
        if (res.data?.success) {
          setSimilarComplaints(res.data.data.similarComplaints || []);
        }
      } catch (err) {
        console.error("Similarity search failed:", err);
      } finally {
        setCheckingSimilarity(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, selectedBlock, selectedFloor, selectedRoom]);

  // File Upload Handlers
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      setError("Maximum 5 image attachments allowed per complaint.");
      return;
    }

    for (const f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 5 MB limit.`);
        return;
      }
    }

    const updatedFiles = [...files, ...selected];
    setFiles(updatedFiles);

    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBlock || !selectedFloor || !selectedRoom) {
      setError("Please specify complete location (Block, Floor, and Room).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("block", selectedBlock);
      formData.append("floor", selectedFloor);
      formData.append("room", selectedRoom);
      formData.append("isAnonymous", isAnonymous);
      formData.append(
        "isSevere",
        isSevere || ["electrical", "leakage", "ragging", "harassment", "misuse"].includes(category)
      );

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        navigate(`/complaints/${res.data.data.complaint._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          File a Maintenance Grievance
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Submit your issue for automatic department routing, SLA deadline allocation, and technician dispatch.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selector */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
              Select College Grievance Category *
            </label>
            <span className="text-[11px] text-neutral-500 font-medium">
              17 Verified College Categories & Anti-Ragging Cell
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {COLLEGE_CATEGORIES.map((item) => {
              const isSelected = category === item.key;
              const Icon = item.icon;
              const isEmergencyCard = ["ragging", "misuse", "harassment"].includes(item.key);

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setCategory(item.key);
                    if (["ragging", "misuse", "harassment", "electrical", "leakage"].includes(item.key)) {
                      setIsSevere(true);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                    isSelected
                      ? item.key === "ragging"
                        ? "bg-red-950 border-red-700 text-white shadow-md ring-2 ring-red-500/50"
                        : item.key === "misuse"
                        ? "bg-amber-950 border-amber-700 text-white shadow-md ring-2 ring-amber-500/50"
                        : "bg-black border-black text-white shadow-md"
                      : `bg-white ${item.cardAccent} text-neutral-700 hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isEmergencyCard
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : item.tagColor
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-tight line-clamp-1 ${
                      isSelected ? "text-white/80" : "text-neutral-500"
                    }`}
                  >
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Dedicated Statutory Alert Callout for Ragging */}
          {category === "ragging" && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 flex items-start gap-3 shadow-xs animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-black text-red-950 uppercase tracking-wide flex items-center gap-2">
                  <span>UGC Anti-Ragging Statutory Alert</span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-600 text-white tracking-widest">
                    Zero Tolerance
                  </span>
                </div>
                <p className="text-red-800 leading-relaxed font-medium">
                  Ragging in any form is a cognizable criminal offence under UGC & Supreme Court of India regulations. This grievance is dispatched with <strong>Emergency Priority</strong> to the <strong>Anti-Ragging Squad</strong> and triggers immediate on-site inspection directives by the <strong>NAAC Quality Committee</strong>.
                </p>
                <div className="text-[11px] text-red-700 font-semibold pt-1">
                  National Anti-Ragging 24x7 Helpline: 1800-180-5522 | Anonymous reporting is fully supported below.
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Alert Callout for Misuse */}
          {category === "misuse" && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-black text-amber-950 uppercase tracking-wide">
                  Campus Facilities & Property Misuse Redressal
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Reports regarding unauthorized lab tampering, classroom defacement, sports/library resource hoarding, or equipment damage will be referred to Estate Administration and Chief Warden with CCTV logs and physical asset verification.
                </p>
              </div>
            </div>
          )}

          {/* Dedicated Alert Callout for Harassment */}
          {category === "harassment" && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow-xs animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-black text-rose-950 uppercase tracking-wide">
                  Internal Complaints Committee (ICC) & Disciplinary Redressal
                </div>
                <p className="text-rose-800 leading-relaxed">
                  Handled with complete confidentiality and immediate protective measures. If you wish to protect your identity, select "File Anonymously" below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cascading Location Picker */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700">
              <MapPin className="w-4 h-4 text-neutral-900" />
              <span>Campus Location Hierarchy *</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan Room QR</span>
            </button>
          </div>

          {isQrAutoFilled && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">📍 Auto-detected via Room QR Code:</span>
                <span className="font-medium text-emerald-900">
                  {selectedBlock} &bull; {selectedFloor} &bull; {selectedRoom}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQrAutoFilled(false)}
                className="text-[11px] underline text-emerald-700 hover:text-emerald-950 font-semibold"
              >
                Change Manually
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Building / Block
              </label>
              <select
                value={selectedBlock}
                onChange={(e) => handleBlockChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {locationsTree.map((loc) => (
                  <option key={loc.block} value={loc.block}>
                    {loc.block}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Floor
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => handleFloorChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {availableFloors.map((fl) => (
                  <option key={fl.floor} value={fl.floor}>
                    {fl.floor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Room / Facility
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {availableRooms.map((rm) => (
                  <option key={rm} value={rm}>
                    {rm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Complaint Title *
              </label>
              {checkingSimilarity && (
                <span className="text-[11px] text-neutral-600 flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking for similar tickets...
                </span>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Overhead projector in Seminar Hall 1 failing to turn on"
              required
              minLength={5}
              maxLength={150}
              className="w-full text-xs p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Similar Complaints "Me Too" De-duplication Panel */}
          {similarComplaints.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-neutral-700" />
                  Similar Active Complaints Detected in this Location:
                </span>
                <span className="text-[11px] text-neutral-600">
                  Upvoting bumps priority & prevents duplicates!
                </span>
              </div>

              <div className="space-y-2">
                {similarComplaints.map((sim) => (
                  <div
                    key={sim._id}
                    className="p-3 rounded-lg bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-900 font-bold">{sim.ticketId}</span>
                        <StatusBadge status={sim.status} />
                      </div>
                      <p className="font-semibold text-neutral-900 truncate">{sim.title}</p>
                      <p className="text-[11px] text-neutral-500">📍 {sim.location?.fullPath}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <UpvoteButton
                        complaintId={sim._id}
                        initialCount={sim.upvoteCount}
                        initialUpvoted={false}
                        creatorId={null}
                      />
                      <button
                        type="button"
                        onClick={() => navigate(`/complaints/${sim._id}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium border border-neutral-200"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details such as symptoms, equipment serial numbers, or safety hazards..."
              rows={4}
              required
              minLength={10}
              className="w-full text-xs p-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Media Attachments Dropzone */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Media Attachments (Optional, max 5 images)
          </label>

          <div className="border-2 border-dashed border-neutral-300 hover:border-neutral-500 rounded-xl p-5 text-center bg-neutral-50/50 hover:bg-neutral-50 transition cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-1">
              <Upload className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-700">
                <span className="font-semibold text-neutral-950 underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-neutral-500">JPG, PNG, or WEBP up to 5 MB per file</p>
            </div>
          </div>

          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {filePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square"
                >
                  <img src={preview} alt="Attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-80 hover:opacity-100 transition shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flag for NAAC Severe Inspection Toggle */}
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-sm flex items-start gap-3">
          <input
            id="severe-toggle"
            type="checkbox"
            checked={isSevere || ["electrical", "leakage", "ragging", "harassment", "misuse"].includes(category)}
            onChange={(e) => setIsSevere(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 bg-white cursor-pointer"
          />
          <label htmlFor="severe-toggle" className="cursor-pointer">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Flag as Severe Campus Grievance for NAAC Committee On-Site Visit
            </span>
            <span className="text-[11px] text-amber-900 block mt-0.5 leading-relaxed">
              Prioritizes this grievance for mandatory on-site physical inspection by the NAAC / IQAC Committee and triggers immediate executive Action Confirmation Orders under strict SLA.
              {["electrical", "leakage", "ragging", "harassment", "misuse"].includes(category) && (
                <span className="font-semibold text-red-700 block mt-1">
                  (Enforced for {category === "ragging" ? "Anti-Ragging Zero Tolerance" : category === "misuse" ? "Facility Misuse" : category} emergencies and safety hazards).
                </span>
              )}
            </span>
          </label>
        </div>

        {/* Anonymous Mode Toggle */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-start gap-3">
          <input
            id="anonymous-toggle"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-black bg-white cursor-pointer"
          />
          <label htmlFor="anonymous-toggle" className="cursor-pointer">
            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-neutral-700" /> File Anonymously
            </span>
            <span className="text-[11px] text-neutral-500 block mt-0.5 leading-relaxed">
              Your name, email, and phone will be concealed on public feeds and staff work queues. Only administrators can reveal your identity through an explicit, audit-logged procedure.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      </form>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScannedLocation={handleScannedLocation}
      />
    </div>
  );
};

