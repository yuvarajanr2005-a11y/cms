import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Radio, Loader2, Sparkles, Inbox } from "lucide-react";
import api from "../../api/axios";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { UpvoteButton } from "../../components/UpvoteButton";
import { SlaCountdown } from "../../components/SlaCountdown";
import { useSocket } from "../../context/SocketContext";

export const PublicFeed = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const { socket } = useSocket();

  const fetchPublicComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      const res = await api.get(`/complaints/public?${params.toString()}`);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints);
      }
    } catch (err) {
      console.error("Failed to load public feed:", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchPublicComplaints();
  }, [fetchPublicComplaints]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpvoted = (data) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === data._id
            ? {
                ...c,
                upvoteCount: data.upvoteCount,
                priority: data.priority,
                priorityScore: data.priorityScore,
                sla: { ...c.sla, dueAt: data.slaDueAt || c.sla?.dueAt }
              }
            : c
        )
      );
    };

    const handleNew = () => {
      fetchPublicComplaints();
    };

    socket.on("complaint:upvoted", handleUpvoted);
    socket.on("complaint:created", handleNew);
    socket.on("complaint:status_updated", handleNew);

    return () => {
      socket.off("complaint:upvoted", handleUpvoted);
      socket.off("complaint:created", handleNew);
      socket.off("complaint:status_updated", handleNew);
    };
  }, [socket, fetchPublicComplaints]);

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.ticketId?.toLowerCase().includes(q) ||
      c.location?.fullPath?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-neutral-900 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Campus Grievance Live Feed
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time feed of active campus issues. Upvote recurring problems to fast-track resolution SLAs.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, locations..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { label: "All Categories", value: "" },
          { label: "🚨 Anti-Ragging", value: "ragging" },
          { label: "⚠️ Facility Misuse", value: "misuse" },
          { label: "🛡️ Harassment", value: "harassment" },
          { label: "🍲 Hostel Mess", value: "food_mess" },
          { label: "🎓 Academic & Labs", value: "academic" },
          { label: "⚡ Electrical", value: "electrical" },
          { label: "💧 Water Leakage", value: "leakage" },
          { label: "🔧 Plumbing", value: "plumbing" },
          { label: "🏢 Hostel", value: "hostel" },
          { label: "🚌 Transport", value: "transport" },
          { label: "📶 WiFi", value: "wifi" },
          { label: "📚 Library", value: "library" },
          { label: "🏆 Sports", value: "sports" },
          { label: "🪑 Furniture", value: "furniture" },
          { label: "✨ Cleaning", value: "cleaning" },
          { label: "🎨 Painting", value: "painting" },
          { label: "❓ Other", value: "other" }
        ].map((pill) => (
          <button
            key={pill.value}
            onClick={() => setCategory(pill.value)}
            className={`px-3 py-1.5 rounded-xl capitalize font-medium whitespace-nowrap transition ${
              category === pill.value
                ? "bg-black text-white border border-black shadow-xs"
                : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Feed Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-700" />
          <span className="text-xs text-neutral-600">Loading public feed...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 space-y-2 shadow-sm">
          <Inbox className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-base font-semibold text-neutral-900">No active complaints found</h3>
          <p className="text-xs text-neutral-500">Everything seems to be running smoothly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition space-y-3.5 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    {item.ticketId}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={item.status} />
                    <PriorityBadge priority={item.priority} />
                  </div>
                </div>

                <Link
                  to={`/complaints/${item._id}`}
                  className="block font-bold text-neutral-900 hover:text-neutral-600 text-sm sm:text-base transition tracking-tight"
                >
                  {item.title}
                </Link>

                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <span>📍 {item.location?.fullPath}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <UpvoteButton
                    complaintId={item._id}
                    initialCount={item.upvoteCount}
                    initialUpvoted={false}
                    creatorId={item.createdBy}
                  />
                  {item.upvoteCount >= 5 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                      <Sparkles className="w-3 h-3" /> Priority escalated by upvotes
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <SlaCountdown
                    dueAt={item.sla?.dueAt}
                    breached={item.sla?.breached}
                    status={item.status}
                  />
                  <Link
                    to={`/complaints/${item._id}`}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs border border-neutral-200 transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
