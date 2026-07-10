import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobKey: {
      type: String,
      required: true,
      trim: true,
    },
    jobSnapshot: {
      title: { type: String, default: "" },
      companyName: { type: String, default: "" },
      location: { type: String, default: "" },
      salary: { type: String, default: "" },
      applicationLink: { type: String, default: "" },
      sourceType: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

savedJobSchema.index({ user: 1, jobKey: 1 }, { unique: true });

export const SavedJob = mongoose.model("SavedJob", savedJobSchema);
