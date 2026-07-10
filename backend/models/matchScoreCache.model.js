import mongoose from "mongoose";

const matchScoreCacheSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobKey: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    tip: { type: String, default: "" },
    source: { type: String, enum: ["gemini", "rules"], default: "rules" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

matchScoreCacheSchema.index({ user: 1, jobKey: 1 }, { unique: true });
matchScoreCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MatchScoreCache = mongoose.model("MatchScoreCache", matchScoreCacheSchema);
