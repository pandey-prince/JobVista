import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import { upload } from "../middlewares/multer.js";

import {
  getCompany,
  getCompanyById,
  registerCompany,
  updateCompany,
} from "../controllers/company.controller.js";
const router = express.Router();
router.route("/register").post(isAuthenticated, requireRole("recruiter"), registerCompany);
router.route("/get").get(isAuthenticated, requireRole("recruiter"), getCompany);
router.route("/get/:id").get(isAuthenticated, requireRole("recruiter"), getCompanyById);
// router.route("/update/:id").put(isAuthenticated,upload updateCompany);
router.put(
  "/update/:id",
  isAuthenticated,
  requireRole("recruiter"),
  upload.single("file"),
  updateCompany,
);
export default router;
