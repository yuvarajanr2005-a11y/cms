import React from "react";

const PRIORITY_STYLES = {
  emergency: "bg-red-50 text-red-800 border-red-300",
  high: "bg-orange-50 text-orange-800 border-orange-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200"
};

export const PriorityBadge = ({ priority }) => {
  const isEmergency = priority === "emergency";
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style}`}
    >
      {isEmergency && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-ping" />
      )}
      {priority}
    </span>
  );
};
