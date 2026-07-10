import { ScrapedJob } from "../models/scrapedJob.model.js";
import { JobSource } from "../models/jobSource.model.js";
import {
  syncAllSources,
  syncSourceById,
} from "../services/scrapeSync.service.js";
import {
  detectScraperType,
  extractCompanySlugFromUrl,
} from "../services/scrapers/index.js";
import { filterItJobs, isItJob } from "../utils/itJobFilter.js";
import { createOrGetJobSource } from "../services/careerSource.service.js";
import {
  getScrapedJobsForList,
  mapScrapedJobForList,
} from "../services/job-catalog/index.js";
import { attachBadgesToJob } from "../utils/jobBadges.js";
import { cleanJobText, extractExperienceFromTitle } from "../utils/jobText.js";

export const listScrapedJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const jobs = await getScrapedJobsForList(keyword);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getScrapedJobById = async (req, res) => {
  try {
    const job = await ScrapedJob.findById(req.params.id).populate("source");
    if (!job || job.status !== "active" || !isItJob(job)) {
      return res.status(404).json({
        success: false,
        message: "Scraped job not found",
      });
    }

    res.status(200).json({
      success: true,
      job: attachBadgesToJob(
        {
          _id: `scraped-${job._id}`,
          scrapedJobId: job._id,
          title: job.title,
          description: cleanJobText(job.description),
          requirements: (job.requirements || []).map((item) => cleanJobText(String(item))),
          experienceLevel: extractExperienceFromTitle(job.title) || "Not specified",
          salary: job.salary,
          location: job.location,
          jobType: job.jobType,
          position: 1,
          company: {
            name: job.companyName,
            logo: job.companyLogo,
          },
          createdAt: job.firstSeenAt,
          lastSeenAt: job.lastSeenAt,
          applications: [],
          external: true,
          externalSource: job.source?.name || job.companyName,
          applicationLink: job.applicationUrl,
          sourceName: job.source?.name,
          sourceUrl: job.source?.url,
        },
        {
          sourceType: "career_page",
          sourceLabel: job.source?.name || job.companyName,
        },
      ),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listJobSources = async (req, res) => {
  try {
    const sources = await JobSource.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      sources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createJobSource = async (req, res) => {
  try {
    const { name, companyName, url, scraperType, selectors, isActive } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Career page URL is required",
      });
    }

    const { source, created } = await createOrGetJobSource({
      url,
      companyName,
      name,
      scraperType,
      selectors,
      sourceOrigin: "admin",
      submittedBy: req.id,
      isPublic: true,
      triggerSync: isActive !== false,
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Career page source added" : "Career page already exists",
      source,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateJobSource = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.url && !updates.scraperType) {
      updates.scraperType = detectScraperType(updates.url);
    }

    const source = await JobSource.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Job source not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job source updated",
      source,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteJobSource = async (req, res) => {
  try {
    const source = await JobSource.findByIdAndDelete(req.params.id);
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Job source not found",
      });
    }

    await ScrapedJob.deleteMany({ source: source._id });

    res.status(200).json({
      success: true,
      message: "Job source removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const triggerFullSync = async (req, res) => {
  try {
    const summary = await syncAllSources();
    res.status(200).json({
      success: true,
      message: "Sync completed",
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const triggerSourceSync = async (req, res) => {
  try {
    const result = await syncSourceById(req.params.id);
    res.status(200).json({
      success: true,
      message: result.success ? "Source synced" : "Source sync failed",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const detectSourceType = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    res.status(200).json({
      success: true,
      scraperType: detectScraperType(url),
      suggestedCompanyName: extractCompanySlugFromUrl(url),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
