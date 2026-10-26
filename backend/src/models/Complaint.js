import mongoose from "mongoose";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  VERIFICATION_METHODS
} from "../utils/constants.js";

// Counter schema for atomic sequential ticket ID generation
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
export const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: CATEGORIES,
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITIES),
      default: PRIORITIES.LOW,
      index: true
    },
    priorityScore: {
      type: Number,
      default: 10,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.SUBMITTED,
      index: true
    },
    location: {
      block: { type: String, required: true, trim: true },
      floor: { type: String, required: true, trim: true },
      room: { type: String, required: true, trim: true },
      fullPath: { type: String, required: true, trim: true }
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentName: {
      type: String,
      default: ""
    },
    studentDept: {
      type: String,
      default: ""
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    assignedAt: {
      type: Date,
      default: null
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    upvoteCount: {
      type: Number,
      default: 0,
      index: true
    },
    sla: {
      dueAt: { type: Date, required: true, index: true },
      hours: { type: Number, required: true },
      breached: { type: Boolean, default: false, index: true },
      escalatedAt: { type: Date, default: null },
      escalationLevel: { type: Number, default: 0 }
    },
    resolution: {
      proofPhoto: {
        url: { type: String, default: null },
        publicId: { type: String, default: null }
      },
      notes: { type: String, default: null },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      resolvedAt: { type: Date, default: null },
      otpHash: { type: String, select: false, default: null },
      otpExpiresAt: { type: Date, default: null },
      otpAttempts: { type: Number, default: 0 },
      verifiedAt: { type: Date, default: null },
      verificationMethod: {
        type: String,
        enum: [...Object.values(VERIFICATION_METHODS), null],
        default: null
      },
      rating: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: null }
    },
    reopen: {
      count: { type: Number, default: 0 },
      reasons: [
        {
          reason: { type: String, required: true },
          at: { type: Date, default: Date.now }
        }
      ],
      lastReopenedAt: { type: Date, default: null }
    },
    naacReview: {
      isSevere: { type: Boolean, default: false, index: true },
      requiresInspection: { type: Boolean, default: false },
      inspectionStatus: {
        type: String,
        enum: ["none", "pending_inspection", "inspected", "action_confirmed"],
        default: "none",
        index: true
      },
      inspectedAt: { type: Date, default: null },
      inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      inspectorName: { type: String, default: null },
      inspectorDesignation: { type: String, default: null },
      inspectionFindings: { type: String, default: null },
      verifiedSeverity: { type: String, default: null },
      actionType: { type: String, default: null },
      actionDetails: { type: String, default: null },
      actionConfirmedAt: { type: Date, default: null },
      actionConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      actionConfirmationSlipId: { type: String, default: null, index: true },
      complianceGrade: { type: String, default: null },
      directiveSlaHours: { type: Number, default: null }
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
// 1. Text index with weights
complaintSchema.index(
  {
    title: "text",
    description: "text",
    "location.fullPath": "text"
  },
  {
    weights: {
      title: 10,
      "location.fullPath": 5,
      description: 1
    },
    name: "ComplaintTextIndex"
  }
);

// 2. Compound index on status, priority, and sla.dueAt
complaintSchema.index({ status: 1, priority: 1, "sla.dueAt": 1 });

// 3. Compound index on createdBy and createdAt
complaintSchema.index({ createdBy: 1, createdAt: -1 });

// 4. Compound index on department and status
complaintSchema.index({ department: 1, status: 1 });

// Atomic sequential ticket ID generator
complaintSchema.pre("validate", async function (next) {
  if (this.ticketId) return next();

  try {
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
      { _id: `ticket_${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const paddedSeq = String(counter.seq).padStart(6, "0");
    this.ticketId = `CMP-${year}-${paddedSeq}`;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Anonymity Serializer
 * If ticket is marked anonymous, strips author contact details unless viewer is the creator or explicitly authorized
 */
complaintSchema.methods.toPublicJSON = function (requestingUserId = null, isAdminRevealed = false) {
  const obj = this.toObject ? this.toObject() : { ...this };
  
  delete obj.resolution?.otpHash;
  delete obj.__v;

  const isOwner = requestingUserId && obj.createdBy?._id
    ? obj.createdBy._id.toString() === requestingUserId.toString()
    : obj.createdBy?.toString() === requestingUserId?.toString();

  if (obj.isAnonymous && !isOwner && !isAdminRevealed) {
    obj.createdBy = {
      _id: null,
      name: "Anonymous Student",
      email: "anonymous@college.edu",
      role: "student"
    };
  }

  return obj;
};

export const Complaint = mongoose.model("Complaint", complaintSchema);
