import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export const NotificationToast = () => {
  const { activeToast, dismissToast } = useSocket();

  if (!activeToast) return null;

  const isEscalation = activeToast.type === "complaint:escalated" || activeToast.title?.includes("Escalated");
  const isResolved = activeToast.type === "complaint:resolved";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="fixed top-5 right-5 z-50 max-w-md w-full shadow-2xl rounded-2xl p-4 border border-neutral-200 bg-white"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            isEscalation
              ? "bg-red-50 text-red-700 border border-red-200"
              : isResolved
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-neutral-100 text-neutral-900 border border-neutral-200"
          }`}>
            {isEscalation ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : isResolved ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <Bell className="w-5 h-5 text-neutral-900" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-neutral-900 tracking-tight">
              {activeToast.title}
            </h4>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              {activeToast.message}
            </p>
          </div>

          <button
            onClick={dismissToast}
            className="text-neutral-400 hover:text-black transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
