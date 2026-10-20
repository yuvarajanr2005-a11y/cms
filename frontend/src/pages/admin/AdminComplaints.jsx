import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  XCircle,
  Eye,
  Loader2,
  Inbox
} from "lucide-react";
import api from "../../api/axios";
import { StatusBadge } from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/PriorityBadge";
import { SlaCountdown } from "../../components/SlaCountdown";
import { AssignModal } from "../../components/AssignModal";
import { RevealIdentityModal } from "../../components/RevealIdentityModal";
import { useSocket } from "../../context/SocketContext";

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const { socket } = useSocket();

  // Modals
  const [activeTicket, setActiveTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);

      const res = await api.get(`/admin/complaints?${params.toString()}`);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints);
      }
    } catch (err) {
      console.error("Failed to load admin complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Real-time live updates
  useEffect(() => {
    if (!socket) return;

    const handleComplaintUpdate = () => {
      fetchComplaints();
    };

    socket.on("complaint:created", handleComplaintUpdate);
    socket.on("complaint:status_updated", handleComplaintUpdate);
    socket.on("complaint:assigned", handleComplaintUpdate);
    socket.on("complaint:escalated", handleComplaintUpdate);
    socket.on("complaint:reopened", handleComplaintUpdate);

    return () => {
      socket.off("complaint:created", handleComplaintUpdate);
      socket.off("complaint:status_updated", handleComplaintUpdate);
      socket.off("complaint:assigned", handleComplaintUpdate);
      socket.off("complaint:escalated", handleComplaintUpdate);
      socket.off("complaint:reopened", handleComplaintUpdate);
    };
  }, [socket, fetchComplaints]);

  const handleForceClose = async (complaintId, ticketId) => {
    const reason = prompt(`Enter administrative reason for force-closing ticket ${ticketId}:`);
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) alert("A reason with at least 5 characters is required.");
      return;
    }

    try {
      const res = await api.post(`/admin/complaints/${complaintId}/force-close`, {
        reason: reason.trim()
      });
      if (res.data?.success) {
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to force close ticket.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-neutral-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              All Campus Grievances
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full administrative oversight: manual technician assignment, SLA overrides, and audited author reveal.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, title, location..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
          <Filter className="w-4 h-4 text-neutral-900" /> Filter By:
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs p-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="escalated">Escalated</option>
          <option value="reopened">Reopened</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs p-2 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
          <span className="text-xs text-neutral-600">Loading campus complaints...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 space-y-2 shadow-sm">
          <Inbox className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-base font-semibold text-neutral-900">No complaints found</h3>
          <p className="text-xs text-neutral-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/90 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Title & Location</th>
                  <th className="py-3 px-4">Priority & SLA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {c.ticketId}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                      <p className="text-[11px] text-neutral-500 truncate">📍 {c.location?.fullPath}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                      <PriorityBadge priority={c.priority} />
                      <div className="text-[11px]">
                        <SlaCountdown dueAt={c.sla?.dueAt} breached={c.sla?.breached} status={c.status} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-700">
                      {c.assignedTo?.name || (
                        <span className="text-neutral-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setActiveTicket(c);
                          setShowAssignModal(true);
                        }}
                        title="Assign / Reassign"
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>

                      {c.isAnonymous && (
                        <button
                          onClick={() => {
                            setActiveTicket(c);
                            setShowRevealModal(true);
                          }}
                          title="Reveal Anonymous Author (Audited)"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}

                      {c.status !== "closed" && (
                        <button
                          onClick={() => handleForceClose(c._id, c.ticketId)}
                          title="Administrative Force Close"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        to={`/complaints/${c._id}`}
                        title="View Full Details"
                        className="p-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white transition inline-block shadow-xs"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeTicket && (
        <>
          <AssignModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            complaint={activeTicket}
            onSuccess={fetchComplaints}
          />
          <RevealIdentityModal
            isOpen={showRevealModal}
            onClose={() => setShowRevealModal(false)}
            complaint={activeTicket}
            onRevealed={fetchComplaints}
          />
        </>
      )}
    </div>
  );
};
