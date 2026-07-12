import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { requireAnyRole } from "../middlewares/requireRole.js";
import {
  fetchAdminDashboard,
  fetchAdminSources,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(isAuthenticated, requireAnyRole("admin"));

router.route("/dashboard").get(fetchAdminDashboard);
router.route("/sources").get(fetchAdminSources);

export default router;
