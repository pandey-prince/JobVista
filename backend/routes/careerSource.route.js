import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import { singleUpload } from "../middlewares/multer.js";
import {
  addUserCompanyList,
  detectCareerSourceType,
  getUserCompanyListJobs,
  importCareerSourcesExcel,
  listPublicSources,
  listUserCompanyLists,
  removeUserCompanyList,
  submitCareerSource,
  updateUserCompanyList,
} from "../controllers/careerSource.controller.js";

const router = express.Router();

router.route("/").get(listPublicSources);
router.route("/detect").post(isAuthenticated, requireRole("student"), detectCareerSourceType);
router.route("/submit").post(isAuthenticated, submitCareerSource);
router
  .route("/import/excel")
  .post(
    isAuthenticated,
    requireRole("recruiter"),
    singleUpload,
    importCareerSourcesExcel
  );

router
  .route("/lists")
  .get(isAuthenticated, listUserCompanyLists)
  .post(isAuthenticated, addUserCompanyList);
router.route("/lists/jobs").get(isAuthenticated, getUserCompanyListJobs);
router.route("/lists/:id").patch(isAuthenticated, updateUserCompanyList);
router.route("/lists/:id").delete(isAuthenticated, removeUserCompanyList);

export default router;
