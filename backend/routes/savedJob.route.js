import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  checkSavedJob,
  listSavedJobKeys,
  listSavedJobs,
  saveJob,
  unsaveJob,
} from "../controllers/savedJob.controller.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("student"));

router.get("/", listSavedJobs);
router.get("/keys", listSavedJobKeys);
router.get("/check/:jobKey", checkSavedJob);
router.post("/", saveJob);
router.delete("/:jobKey", unsaveJob);

export default router;
