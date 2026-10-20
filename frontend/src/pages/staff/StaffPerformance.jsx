import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Clock, RotateCcw, Star, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { StarRating } from "../../components/StarRating";

export const StaffPerformance = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await api.get("/staff/performance");
        if (res.data?.success) {
          setPerformance(res.data.data.performance || {});
        }
      } catch (err) {
        console.error("Failed to load scorecard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-neutral-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-800" />
        <span className="text-xs text-neutral-600">Loading performance scorecard...</span>
      </div>
    );
  }

  const resolved = performance?.resolvedCount || 0;
  const avgMins = performance?.avgResolutionMinutes || 0;
  const avgHours = Math.round((avgMins / 60) * 10) / 10;
  const reopened = performance?.reopenedCount || 0;
  const ratingCount = performance?.ratingCount || 0;
  const totalRatingSum = performance?.totalRatingSum || 0;
  const avgRating = ratingCount > 0 ? Math.round((totalRatingSum / ratingCount) * 10) / 10 : 5.0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-neutral-900" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            My Performance Scorecard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time quality metrics calculated from completed repairs, student confirmations, and SLA adherence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-900" />
          </div>
          <p className="text-3xl font-extrabold text-neutral-900">{resolved}</p>
          <span className="text-[11px] text-neutral-500">Verified repair completions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-neutral-900" />
          </div>
          <p className="text-3xl font-extrabold text-neutral-900">
            {avgHours} <span className="text-base font-normal text-neutral-500">hrs</span>
          </p>
          <span className="text-[11px] text-neutral-500">({avgMins} minutes avg)</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Reopened Tickets</span>
            <RotateCcw className="w-4 h-4 text-neutral-900" />
          </div>
          <p className="text-3xl font-extrabold text-neutral-900">{reopened}</p>
          <span className="text-[11px] text-neutral-500">Disputed within 48h window</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Student Rating</span>
            <Star className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-neutral-900">{avgRating}</span>
            <span className="text-xs text-neutral-500">/ 5.0</span>
          </div>
          <StarRating value={Math.round(avgRating)} readOnly size="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
