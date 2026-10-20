import React from "react";

const STATUS_STYLES = {
  submitted: "bg-sky-50 text-sky-700 border-sky-200",
  assigned: "bg-purple-50 text-purple-700 border-purple-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  pending_verification: "bg-cyan-50 text-cyan-800 border-cyan-200",
  closed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  reopened: "bg-orange-50 text-orange-800 border-orange-200",
  escalated: "bg-rose-50 text-rose-800 border-rose-300 font-bold"
};

const STATUS_LABELS = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  closed: "Closed",
  reopened: "Reopened",
  escalated: "Escalated"
};

export const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || "bg-neutral-100 text-neutral-700 border-neutral-200";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {status === "escalated" && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  );
};
