import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { upload } from "../middlewares/multer.js";

import {
  getCompany,
  getCompanyById,
  registerCompany,
  updateCompany,
} from "../controllers/company.controller.js";
const router = express.Router();
router.route("/register").post(isAuthenticated, registerCompany);
router.route("/get").get(isAuthenticated, getCompany);
router.route("/get/:id").get(isAuthenticated, getCompanyById);
// router.route("/update/:id").put(isAuthenticated,upload updateCompany);
router.put(
  "/update/:id",
  isAuthenticated,
  upload.single("file"),
  updateCompany,
);
export default router;
