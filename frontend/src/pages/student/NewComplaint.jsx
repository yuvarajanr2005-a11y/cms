import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  HelpCircle
} from "lucide-react";
import api from "../../api/axios";
import { UpvoteButton } from "../../components/UpvoteButton";
import { StatusBadge } from "../../components/StatusBadge";

const CATEGORY_ICONS = {
  electrical: Zap,
  leakage: Droplet,
  wifi: Wifi,
  furniture: Armchair,
  painting: Paintbrush,
  plumbing: Wrench,
  cleaning: Sparkles,
  other: HelpCircle
};

export const NewComplaint = () => {
  const navigate = useNavigate();

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
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Similarity Search State
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [checkingSimilarity, setCheckingSimilarity] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch cascading campus locations
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
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);

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
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Issue Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(CATEGORY_ICONS).map(([catKey, Icon]) => {
              const isSelected = category === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition text-xs font-semibold capitalize ${
                    isSelected
                      ? "bg-black border-black text-white shadow-sm"
                      : "bg-white border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-neutral-500"}`} />
                  <span>{catKey}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cascading Location Picker */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700">
            <MapPin className="w-4 h-4 text-neutral-900" />
            <span>Campus Location Hierarchy *</span>
          </div>

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
    </div>
  );
};
