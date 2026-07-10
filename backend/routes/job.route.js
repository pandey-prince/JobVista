import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  getAdminJobs,
  getAllJobs,
  getJobById,
  postJob,
} from "../controllers/job.controller.js";
import { getMatchScore } from "../controllers/matchScore.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, requireRole("recruiter"), postJob);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, requireRole("recruiter"), getAdminJobs);
router.route("/get/:id").get(getJobById);
router.route("/match-score").post(isAuthenticated, requireRole("student"), getMatchScore);

export default router;
