import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  createTrackedApplication,
  deleteTrackedApplication,
  listTrackedApplications,
  updateTrackedApplication,
} from "../controllers/trackedApplication.controller.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("student"));

router.get("/", listTrackedApplications);
router.post("/", createTrackedApplication);
router.patch("/:id", updateTrackedApplication);
router.delete("/:id", deleteTrackedApplication);

export default router;
