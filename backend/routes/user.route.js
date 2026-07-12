import express from "express";
import {
  register,
  updateProfile,
  login,
  logout,
  getMe,
  verifyEmail,
  resendOtp,
  googleLogin,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { parseMultipartFields } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-otp").post(resendOtp);
router.route("/login").post(login);
router.route("/google").post(googleLogin);
router.route("/me").get(isAuthenticated, getMe);
router.route("/profile/update").post(isAuthenticated, parseMultipartFields, updateProfile);
router.route("/logout").post(logout);

export default router;
