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
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.route("/register").post(authLimiter, register);
router.route("/verify-email").post(authLimiter, verifyEmail);
router.route("/resend-otp").post(authLimiter, resendOtp);
router.route("/login").post(authLimiter, login);
router.route("/google").post(authLimiter, googleLogin);
router.route("/me").get(isAuthenticated, getMe);
router.route("/profile/update").post(isAuthenticated, parseMultipartFields, updateProfile);
router.route("/logout").post(logout);

export default router;
