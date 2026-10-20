import React, { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const UpvoteButton = ({
  complaintId,
  initialCount = 0,
  initialUpvoted = false,
  creatorId,
  onUpvoteChange
}) => {
  const { user } = useAuth();
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const isOwner = user && (user._id === creatorId || user._id === creatorId?._id);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isOwner || loading) return;

    setLoading(true);
    try {
      const res = await api.post(`/complaints/${complaintId}/upvote`);
      if (res.data?.success) {
        setUpvoted(res.data.data.upvoted);
        setCount(res.data.data.upvoteCount);
        if (onUpvoteChange) {
          onUpvoteChange(res.data.data);
        }
      }
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileTap={!isOwner ? { scale: 0.92 } : {}}
      disabled={isOwner || loading}
      onClick={handleToggle}
      title={isOwner ? "You cannot upvote your own complaint" : "Upvote this complaint ('Me Too')"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
        upvoted
          ? "bg-black text-white border-black shadow-sm"
          : isOwner
          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 hover:text-black"
      }`}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? "fill-white text-white" : ""}`} />
      <span>{count}</span>
      <span className="hidden sm:inline text-[11px] font-normal opacity-90">
        {upvoted ? "Upvoted" : "Me Too"}
      </span>
    </motion.button>
  );
};
