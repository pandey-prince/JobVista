import mongoose from "mongoose";

const scrapedJobSchema = new mongoose.Schema(
  {
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobSource",
      required: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "Not specified",
    },
    jobType: {
      type: String,
      default: "Full-time",
    },
    salary: {
      type: String,
      default: "Not disclosed",
    },
    requirements: [
      {
        type: String,
      },
    ],
    applicationUrl: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

scrapedJobSchema.index({ source: 1, externalId: 1 }, { unique: true });
scrapedJobSchema.index({ status: 1, firstSeenAt: -1 });

export const ScrapedJob = mongoose.model("ScrapedJob", scrapedJobSchema);
