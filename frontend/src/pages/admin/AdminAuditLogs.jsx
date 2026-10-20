import React, { useState, useEffect, useCallback } from "react";
import { FileClock, Search, Filter, Loader2, ShieldAlert, Terminal, Eye, X } from "lucide-react";
import api from "../../api/axios";

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (actionFilter) params.append("action", actionFilter);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileClock className="w-5 h-5 text-neutral-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Immutable System Audit Trail
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Append-only tamper-proof log recording all authentications, escalations, assignments, and identity reveals.
          </p>
        </div>

        {/* Filter dropdown */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs p-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black self-start sm:self-auto"
        >
          <option value="">All Actions</option>
          <option value="COMPLAINT_CREATED">Complaint Created</option>
          <option value="COMPLAINT_ASSIGNED">Complaint Assigned</option>
          <option value="COMPLAINT_RESOLVED">Complaint Resolved</option>
          <option value="COMPLAINT_VERIFIED">Complaint Verified</option>
          <option value="COMPLAINT_REOPENED">Complaint Reopened</option>
          <option value="COMPLAINT_ESCALATED">Complaint Escalated</option>
          <option value="IDENTITY_REVEALED">Identity Revealed</option>
          <option value="USER_LOGIN">User Login</option>
          <option value="USER_REGISTER">User Register</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
          <span className="text-xs text-neutral-600">Loading immutable audit logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-neutral-200 p-8 text-xs text-neutral-500 shadow-sm">
          No audit logs recorded for this criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100/90 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-sans font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right font-sans">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log) => {
                  const isIdentityReveal = log.action === "IDENTITY_REVEALED";
                  const isEscalation = log.action === "COMPLAINT_ESCALATED";

                  return (
                    <tr
                      key={log._id}
                      className={`hover:bg-neutral-50/80 transition ${
                        isIdentityReveal
                          ? "bg-amber-50/70"
                          : isEscalation
                          ? "bg-red-50/70"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            isIdentityReveal
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : isEscalation
                              ? "bg-red-100 text-red-900 border border-red-300"
                              : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-neutral-800 font-semibold">
                        {log.entityType} ({String(log.entityId).slice(-6)})
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-neutral-800">
                        {log.performedBySystem ? (
                          <span className="text-neutral-900 font-bold">system [cron]</span>
                        ) : (
                          log.performedBy?.name || "Anonymous/Guest"
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                        {log.ipAddress || "::1"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 font-sans text-xs font-medium transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-neutral-900" />
              <h3 className="text-sm font-bold text-neutral-900">
                Audit Record Payload: {selectedLog.action}
              </h3>
            </div>

            <pre className="text-xs p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono overflow-x-auto max-h-80">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-black hover:bg-neutral-800 text-white rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
