import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  Loader2,
  Star
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import api from "../../api/axios";
import { StarRating } from "../../components/StarRating";
import { useSocket } from "../../context/SocketContext";

export const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [resolutionTimes, setResolutionTimes] = useState([]);
  const [locationsHeatmap, setLocationsHeatmap] = useState([]);
  const [staffScorecards, setStaffScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchAnalytics = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [resOverview, resResTimes, resLocs, resStaff] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/resolution-time"),
        api.get("/admin/analytics/locations"),
        api.get("/admin/analytics/staff-performance")
      ]);

      if (resOverview.data?.success) setOverview(resOverview.data.data.overview);
      if (resResTimes.data?.success) setResolutionTimes(resResTimes.data.data.resolutionTimes || []);
      if (resLocs.data?.success) setLocationsHeatmap(resLocs.data.data.heatmap || []);
      if (resStaff.data?.success) setStaffScorecards(resStaff.data.data.scorecards || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchAnalytics(false);
    };

    socket.on("complaint:created", handleUpdate);
    socket.on("complaint:status_updated", handleUpdate);
    socket.on("complaint:assigned", handleUpdate);
    socket.on("complaint:escalated", handleUpdate);
    socket.on("complaint:reopened", handleUpdate);

    return () => {
      socket.off("complaint:created", handleUpdate);
      socket.off("complaint:status_updated", handleUpdate);
      socket.off("complaint:assigned", handleUpdate);
      socket.off("complaint:escalated", handleUpdate);
      socket.off("complaint:reopened", handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
        <span className="text-xs text-neutral-600">Computing campus analytics pipelines...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-neutral-900" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Campus Grievance Intelligence & Analytics
          </h1>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Real-time aggregation pipelines computing department SLA compliance, location hotspots, and technician efficiency.
        </p>
      </div>

      {/* Overview Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Grievances
            </span>
            <p className="text-3xl font-extrabold text-neutral-900">{overview.totalComplaints}</p>
            <span className="text-[11px] text-neutral-500">Across all campus departments</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              SLA Breach Rate
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-red-600">{overview.breachRate}%</p>
              <span className="text-xs text-red-600">({overview.breachedCount} breached)</span>
            </div>
            <span className="text-[11px] text-neutral-500">Target compliance threshold: &lt; 5%</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Escalated Tickets
            </span>
            <p className="text-3xl font-extrabold text-neutral-900">{overview.escalatedCount}</p>
            <span className="text-[11px] text-neutral-500">Active Level 1 & Level 2 escalations</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Resolved & Closed
            </span>
            <p className="text-3xl font-extrabold text-neutral-900">
              {overview.statusMap?.closed || 0}
            </p>
            <span className="text-[11px] text-neutral-500">Dual proof verified tickets</span>
          </div>
        </div>
      )}

      {/* Chart 1: Average Resolution Time per Department */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-900" />
              Average Resolution Time per Department (Hours)
            </h3>
            <p className="text-xs text-neutral-500">
              Computed from ticket inception to verified closure.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          {resolutionTimes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-neutral-500">
              No closed resolution data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionTimes} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="departmentCode"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    color: "#171717",
                    fontSize: "12px"
                  }}
                  formatter={(val) => [`${val} hrs`, "Avg Duration"]}
                  labelFormatter={(code) => {
                    const match = resolutionTimes.find((r) => r.departmentCode === code);
                    return match ? match.departmentName : code;
                  }}
                />
                <Bar dataKey="avgResolutionHours" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: 30-Day Registration vs Closure Trends */}
      {overview?.dailyTrends && overview.dailyTrends.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-900" />
              Grievance Inflow vs Resolution Velocity
            </h3>
            <p className="text-xs text-neutral-500">
              Daily registered complaints compared against verified closures.
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#737373" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#737373" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    color: "#171717",
                    fontSize: "12px"
                  }}
                />
                <Area type="monotone" dataKey="registered" stroke="#737373" fillOpacity={1} fill="url(#colorReg)" />
                <Area type="monotone" dataKey="closed" stroke="#171717" fillOpacity={1} fill="url(#colorClosed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid: Location Hotspots & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campus Location Heatmap List */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-900" />
              Top Campus Complaint Hotspots
            </h3>
            <p className="text-xs text-neutral-500">
              Locations ranked by recurring incident density.
            </p>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {locationsHeatmap.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No location data found.</p>
            ) : (
              locationsHeatmap.map((loc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-neutral-900 block">{loc.block}</span>
                    <span className="text-[11px] text-neutral-500">
                      {loc.floor} • {loc.room}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-neutral-900">
                      {loc.totalComplaints}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">tickets</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Performance Scorecards Table */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-900" />
              Technician Efficiency Scorecards
            </h3>
            <p className="text-xs text-neutral-500">
              Resolved count, SLA compliance %, reopen penalty, and student ratings.
            </p>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {staffScorecards.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No staff metrics found.</p>
            ) : (
              staffScorecards.map((st) => (
                <div
                  key={st._id}
                  className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">{st.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-mono font-semibold">
                        {st.department?.code || "GEN"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-neutral-900">{st.avgRating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                    <div>
                      Resolved: <span className="text-neutral-900 font-semibold">{st.totalResolved}</span>
                    </div>
                    <div>
                      SLA: <span className="text-neutral-900 font-semibold">{st.slaComplianceRate}%</span>
                    </div>
                    <div>
                      Reopen: <span className="text-neutral-900 font-semibold">{st.reopenRate}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
