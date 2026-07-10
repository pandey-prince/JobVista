import mongoose from "mongoose";

const STAGES = ["applied", "shortlisted", "interview", "offer", "rejected"];

const trackedApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobKey: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    applicationUrl: { type: String, default: "", trim: true },
    sourceType: { type: String, default: "", trim: true },
    stage: {
      type: String,
      enum: STAGES,
      default: "applied",
    },
    appliedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "", trim: true },
    isManual: { type: Boolean, default: false },
    internalApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
  },
  { timestamps: true },
);

trackedApplicationSchema.index({ user: 1, jobKey: 1 });
trackedApplicationSchema.index({ user: 1, stage: 1 });

export const TRACKED_STAGES = STAGES;
export const TrackedApplication = mongoose.model(
  "TrackedApplication",
  trackedApplicationSchema,
);
