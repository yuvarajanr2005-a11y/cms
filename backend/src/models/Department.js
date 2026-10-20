import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    categoriesHandled: {
      type: [String],
      default: []
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    escalationContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Department = mongoose.model("Department", departmentSchema);
