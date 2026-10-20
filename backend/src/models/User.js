import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, STAFF_TYPES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      index: true
    },
    staffType: {
      type: String,
      enum: Object.values(STAFF_TYPES),
      default: null
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    avatar: {
      type: String,
      default: ""
    },
    // Performance metrics for staff members
    performance: {
      resolvedCount: {
        type: Number,
        default: 0
      },
      avgResolutionMinutes: {
        type: Number,
        default: 0
      },
      reopenedCount: {
        type: Number,
        default: 0
      },
      totalRatingSum: {
        type: Number,
        default: 0
      },
      ratingCount: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save hook to hash password with bcrypt cost 12
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is temporarily locked
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

// Handle failed login attempt with 15 min lock after 5 failures
userSchema.methods.handleFailedLogin = async function () {
  const attempts = (this.failedLoginAttempts || 0) + 1;
  const updates = { failedLoginAttempts: attempts };

  if (attempts >= 5) {
    // Lock for 15 minutes
    updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await this.updateOne(updates);
  return { attempts, isLocked: attempts >= 5 };
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

export const User = mongoose.model("User", userSchema);
