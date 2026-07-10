import { ScrapedJob } from "../models/scrapedJob.model.js";
import { JobSource } from "../models/jobSource.model.js";
import { UserCompanyList } from "../models/userCompanyList.model.js";
import {
  createOrGetJobSource,
} from "../services/careerSource.service.js";
import { parseCareerSourcesSpreadsheet } from "../utils/parseCareerSourcesSpreadsheet.js";
import {
  detectScraperType,
  extractCompanySlugFromUrl,
} from "../services/scrapers/index.js";
import { mapScrapedJobForList } from "../services/job-catalog/index.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
import {
  parsePagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

export const listPublicSources = async (req, res) => {
  try {
    const search = String(req.query.search || req.query.keyword || "").trim();
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: 50,
    });

    const query = { isPublic: true };
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [{ companyName: regex }, { name: regex }];
    }

    const [total, sources] = await Promise.all([
      JobSource.countDocuments(query),
      JobSource.find(query).sort({ companyName: 1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      sources,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCareerSource = async (req, res) => {
  try {
    const { url, companyName, name, addToWatchlist } = req.body;
    const userId = req.id;

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
      sourceOrigin: "user",
      submittedBy: userId,
      isPublic: true,
      triggerSync: true,
    });

    let watchlistEntry = null;
    if (addToWatchlist !== false) {
      watchlistEntry = await UserCompanyList.findOneAndUpdate(
        { user: userId, jobSource: source._id, listType: "watchlist" },
        {
          user: userId,
          jobSource: source._id,
          companyName: source.companyName,
          careerUrl: source.url,
          listType: "watchlist",
          alertEnabled: true,
        },
        { upsert: true, new: true }
      );
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "Career page added and sync started"
        : "Career page already exists — sync refreshed",
      source,
      watchlistEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importCareerSourcesExcel = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Upload an Excel or CSV file",
      });
    }

    const rows = parseCareerSourcesSpreadsheet(req.file.buffer);
    const results = [];

    for (const row of rows) {
      try {
        const { source, created } = await createOrGetJobSource({
          url: row.careerUrl,
          companyName: row.companyName,
          name: row.name,
          scraperType: row.scraperType || undefined,
          sourceOrigin: "excel",
          submittedBy: req.id,
          isPublic: true,
          triggerSync: true,
        });

        results.push({
          companyName: row.companyName,
          success: true,
          created,
          sourceId: source._id,
          isActive: source.isActive,
        });
      } catch (error) {
        results.push({
          companyName: row.companyName,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${results.length} companies from spreadsheet`,
      summary: {
        total: results.length,
        created: results.filter((r) => r.success && r.created).length,
        existing: results.filter((r) => r.success && !r.created).length,
        failed: results.filter((r) => !r.success).length,
        active: results.filter((r) => r.success && r.isActive).length,
      },
      results,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const detectCareerSourceType = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listUserCompanyLists = async (req, res) => {
  try {
    const userId = req.id;
    const listType = req.query.type || "watchlist";
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 10,
      maxLimit: 50,
    });

    const query = { user: userId };
    if (listType === "watchlist") {
      query.listType = { $in: ["watchlist", "wishlist"] };
    } else if (listType) {
      query.listType = listType;
    }

    const total = await UserCompanyList.countDocuments(query);
    const lists = await UserCompanyList.find(query)
      .populate("jobSource")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enriched = await Promise.all(
      lists.map(async (entry) => {
        const jobCount = entry.jobSource?._id
          ? await ScrapedJob.countDocuments({
              source: entry.jobSource._id,
              status: "active",
            })
          : 0;

        return {
          ...entry.toObject(),
          activeJobCount: jobCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      lists: enriched,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addUserCompanyList = async (req, res) => {
  try {
    const userId = req.id;
    const {
      listType: requestedListType = "watchlist",
      jobSourceId,
      companyName,
      careerUrl,
      notes,
      createSource = true,
    } = req.body;

    const listType = "watchlist";

    if (requestedListType && !["watchlist", "wishlist"].includes(requestedListType)) {
      return res.status(400).json({
        success: false,
        message: "listType must be watchlist or wishlist",
      });
    }

    let source = null;

    if (jobSourceId) {
      source = await JobSource.findById(jobSourceId);
      if (!source) {
        return res.status(404).json({
          success: false,
          message: "Selected company source was not found",
        });
      }
    } else if (careerUrl && createSource) {
      const result = await createOrGetJobSource({
        url: careerUrl,
        companyName,
        sourceOrigin: "user",
        submittedBy: userId,
        isPublic: true,
        triggerSync: listType === "watchlist",
      });
      source = result.source;
    }

    if (!source && !companyName) {
      return res.status(400).json({
        success: false,
        message: "Provide a company name, career URL, or existing source",
      });
    }

    const resolvedCompanyName =
      source?.companyName || companyName || "Unknown Company";

    const duplicateQuery = source?._id
      ? { user: userId, jobSource: source._id, listType }
      : {
          user: userId,
          companyName: resolvedCompanyName,
          listType,
          jobSource: null,
        };

    const existing = await UserCompanyList.findOne(duplicateQuery);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Company already in your list",
        list: existing,
      });
    }

    const list = await UserCompanyList.create({
      user: userId,
      jobSource: source?._id || null,
      companyName: resolvedCompanyName,
      careerUrl: careerUrl || source?.url || "",
      listType,
      notes: notes || "",
      alertEnabled: listType === "watchlist",
    });

    const populated = await UserCompanyList.findById(list._id).populate(
      "jobSource"
    );

    res.status(201).json({
      success: true,
      message: `Added to ${listType}`,
      list: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Company already exists in this list",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserCompanyList = async (req, res) => {
  try {
    const userId = req.id;
    const { alertEnabled } = req.body;

    const list = await UserCompanyList.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: "List entry not found",
      });
    }

    if (typeof alertEnabled === "boolean") {
      list.alertEnabled = alertEnabled;
      await list.save();
    }

    return res.status(200).json({
      success: true,
      message: "Watchlist updated",
      list,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeUserCompanyList = async (req, res) => {
  try {
    const userId = req.id;
    const list = await UserCompanyList.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: "List entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed from your list",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserCompanyListJobs = async (req, res) => {
  try {
    const userId = req.id;
    const listType = req.query.type || "watchlist";
    const keyword = req.query.keyword || "";
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 8,
      maxLimit: 24,
    });

    const listQuery =
      listType === "watchlist"
        ? { user: userId, listType: { $in: ["watchlist", "wishlist"] } }
        : { user: userId, listType };

    const lists = await UserCompanyList.find(listQuery).populate("jobSource");

    const sourceIds = lists
      .map((entry) => entry.jobSource?._id)
      .filter(Boolean);

    if (!sourceIds.length) {
      return res.status(200).json({
        success: true,
        jobs: [],
        lists,
        pagination: buildPaginationMeta({ page, limit, total: 0 }),
      });
    }

    const query = { source: { $in: sourceIds }, status: "active" };
    if (keyword) {
      const regex = { $regex: keyword, $options: "i" };
      query.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { companyName: regex },
      ];
    }

    const total = await ScrapedJob.countDocuments(query);
    const scrapedJobs = await ScrapedJob.find(query)
      .populate("source")
      .sort({ firstSeenAt: -1 })
      .skip(skip)
      .limit(limit);

    const jobs = filterIndiaJobs(filterItJobs(scrapedJobs)).map(mapScrapedJobForList);

    res.status(200).json({
      success: true,
      jobs,
      lists,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
