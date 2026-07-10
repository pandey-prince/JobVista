import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  applyJob,
  getApplicants,
  getAppliedJobs,
  updateStatus,
} from "../controllers/application.controller.js";

const router = express.Router();
router.route("/apply/:id").get(isAuthenticated, requireRole("student"), applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, requireRole("recruiter"), getApplicants);
router.route("/status/:id/update").post(isAuthenticated, requireRole("recruiter"), updateStatus);


export default router;