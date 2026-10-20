import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export const SlaCountdown = ({ dueAt, breached, status }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isPastDue, setIsPastDue] = useState(Boolean(breached));

  useEffect(() => {
    if (!dueAt || status === "closed") return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(dueAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsPastDue(true);
        const overDiff = Math.abs(diff);
        const hours = Math.floor(overDiff / (1000 * 60 * 60));
        const mins = Math.floor((overDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`Breached by ${hours}h ${mins}m`);
      } else {
        setIsPastDue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dueAt, status, breached]);

  if (status === "closed") {
    return (
      <span className="inline-flex items-center text-xs text-emerald-700 gap-1 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        SLA Resolved
      </span>
    );
  }

  if (isPastDue || breached) {
    return (
      <span className="inline-flex items-center text-xs text-red-700 gap-1 font-semibold animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        {timeLeft || "SLA Breached"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs text-neutral-700 gap-1 font-mono">
      <Clock className="w-3.5 h-3.5 text-neutral-900" />
      {timeLeft || "Calculating..."}
    </span>
  );
};
