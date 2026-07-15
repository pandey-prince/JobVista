import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  dismissJob,
  listDismissedJobKeys,
  listDismissedJobs,
  undismissJob,
} from "../controllers/dismissedJob.controller.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("student"));

router.get("/", listDismissedJobs);
router.get("/keys", listDismissedJobKeys);
router.post("/", dismissJob);
router.delete("/:jobKey", undismissJob);

export default router;
