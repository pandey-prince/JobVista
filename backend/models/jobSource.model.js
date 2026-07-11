import mongoose from "mongoose";

const jobSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    scraperType: {
      type: String,
      enum: [
        "greenhouse",
        "lever",
        "ashby",
        "generic",
        "tcs-ibegin",
        "successfactors-rss",
        "smartdreamers",
        "puppeteer",
        "workday",
        "smartrecruiters",
        "auto-puppeteer",
        "unsupported",
      ],
      required: true,
    },
    selectors: {
      jobList: { type: String, default: "" },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      location: { type: String, default: "" },
      link: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scrapeIntervalHours: {
      type: Number,
      default: 6,
    },
    lastScrapedAt: {
      type: Date,
      default: null,
    },
    lastScrapeStatus: {
      type: String,
      enum: ["success", "error", "pending", "never"],
      default: "never",
    },
    lastScrapeError: {
      type: String,
      default: "",
    },
    jobsFoundCount: {
      type: Number,
      default: 0,
    },
    sourceOrigin: {
      type: String,
      enum: ["seed", "admin", "user", "excel"],
      default: "seed",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    priorityPuppeteerSync: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

jobSourceSchema.index({ url: 1 }, { unique: true });

export const JobSource = mongoose.model("JobSource", jobSourceSchema);
