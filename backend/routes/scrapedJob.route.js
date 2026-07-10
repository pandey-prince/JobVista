import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import requireCronSecret from "../middlewares/requireCronSecret.js";
import {
  createJobSource,
  deleteJobSource,
  detectSourceType,
  getScrapedJobById,
  listJobSources,
  listScrapedJobs,
  triggerFullSync,
  triggerLinkCheck,
  triggerOpsSync,
  triggerSourceSync,
  updateJobSource,
} from "../controllers/scrapedJob.controller.js";

const router = express.Router();

router.route("/").get(listScrapedJobs);
router.route("/sync").post(isAuthenticated, requireRole("recruiter"), triggerFullSync);
router.route("/sync/ops").post(requireCronSecret, triggerOpsSync);
router
  .route("/sources")
  .get(isAuthenticated, requireRole("recruiter"), listJobSources)
  .post(isAuthenticated, requireRole("recruiter"), createJobSource);
router
  .route("/sources/detect")
  .post(isAuthenticated, requireRole("recruiter"), detectSourceType);
router
  .route("/sources/:id")
  .put(isAuthenticated, requireRole("recruiter"), updateJobSource)
  .delete(isAuthenticated, requireRole("recruiter"), deleteJobSource);
router
  .route("/sources/:id/sync")
  .post(isAuthenticated, requireRole("recruiter"), triggerSourceSync);
router
  .route("/link-check")
  .post(isAuthenticated, requireRole("recruiter"), triggerLinkCheck);
router.route("/:id").get(getScrapedJobById);

export default router;
