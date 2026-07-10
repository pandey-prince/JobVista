import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  createAlert,
  deleteAlert,
  listAlerts,
  previewAlertMatches,
  sendAlertNow,
  sendAlertTest,
  updateAlert,
} from "../controllers/alert.controller.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("student"));

router.get("/", listAlerts);
router.post("/", createAlert);
router.post("/test-email", sendAlertTest);
router.put("/:id", updateAlert);
router.delete("/:id", deleteAlert);
router.get("/:id/preview", previewAlertMatches);
router.post("/:id/send-now", sendAlertNow);

export default router;
