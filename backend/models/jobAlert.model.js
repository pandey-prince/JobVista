import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyword: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    experienceLevel: { type: String, default: "", trim: true },
    companyName: { type: String, default: "", trim: true },
    sourceType: {
      type: String,
      enum: ["", "career_page", "recruiter", "remotive", "arbeitnow"],
      default: "",
    },
    frequency: {
      type: String,
      enum: ["daily", "instant"],
      default: "daily",
    },
    isActive: { type: Boolean, default: true },
    lastSentAt: { type: Date, default: null },
    lastMatchedJobKeys: { type: [String], default: [] },
  },
  { timestamps: true },
);

jobAlertSchema.index({ user: 1, isActive: 1 });

export const JobAlert = mongoose.model("JobAlert", jobAlertSchema);
