import express from "express",
import isAuthenticated from "../middlewares/isAuthenticated.js"
import { getAdminJobs, getAllJobs, getJobById, postJob } from "../controllers/job.controller";

const router = express.Router();


router.route("./post").post(isAuthenticated,postJob);
router.route("./get").post(isAuthenticated,getAllJobs);
router.route("./getadminjobs").post(isAuthenticated,getAdminJobs);
router.route("./get/:id").post(isAuthenticated,getJobById);

export default router;  