import express from "express";
import {
  register,
  updateProfile,
  login,
  logout,
  getMe,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
const router = express.Router();
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").get(isAuthenticated, getMe);
router.route("/profile/update").post(isAuthenticated, updateProfile);
router.route("/logout").post(logout);
export default router;
