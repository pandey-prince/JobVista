import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  generateOtp,
  resendSignupOtp,
  sendSignupOtp,
  verifySignupOtp,
} from "../services/otp.service.js";

const getSafeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  emailVerified: user.emailVerified !== false,
  authProvider: user.authProvider || "local",
  profile: user.profile,
});

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

const issueSession = (res, user, message) => {
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json({
      message,
      success: true,
      user: getSafeUser(user),
    });
};

const normalizeEmail = (email) => String(email).trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const { fullname, email, password, phoneNumber, role } = req.body;
    if (!fullname || !email || !password || !phoneNumber) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    if (role === "recruiter" || role === "admin") {
      return res.status(403).json({
        message: "Recruiter signup is disabled. JobLeLo is for job seekers only.",
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing?.emailVerified) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    }

    if (existing?.authProvider === "google") {
      return res.status(400).json({
        message: "This email is registered with Google. Sign in with Google instead.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user = existing;

    if (user) {
      user.fullname = fullname;
      user.phoneNumber = phoneNumber;
      user.password = hashedPassword;
      user.authProvider = "local";
      user.emailVerified = false;
      await user.save();
    } else {
      user = await User.create({
        fullname,
        email: normalizedEmail,
        phoneNumber,
        role: "student",
        password: hashedPassword,
        authProvider: "local",
        emailVerified: false,
      });
    }

    const otp = generateOtp();
    await sendSignupOtp(normalizedEmail, otp);

    return res.status(201).json({
      message: "Verification code sent to your email.",
      success: true,
      needsVerification: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[Register]", error.message);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required",
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    await verifySignupOtp(normalizedEmail, otp);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "Account not found",
        success: false,
      });
    }

    user.emailVerified = true;
    await user.save();

    return issueSession(res, user, "Email verified. Welcome to JobLeLo!");
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error("[VerifyEmail]", error.message);
    return res.status(status).json({
      message: error.message || "Unable to verify email",
      success: false,
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
        success: false,
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email is already verified",
        success: false,
      });
    }

    await resendSignupOtp(normalizedEmail);

    return res.status(200).json({
      message: "Verification code sent",
      success: true,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error("[ResendOtp]", error.message);
    return res.status(status).json({
      message: error.message || "Unable to resend code",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    if (user.role === "recruiter") {
      return res.status(403).json({
        message: "Recruiter accounts are disabled. JobLeLo is for job seekers only.",
        success: false,
      });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Continue with Google.",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    if (user.emailVerified === false) {
      try {
        await resendSignupOtp(normalizedEmail);
      } catch (otpError) {
        console.warn("[Login] resend OTP failed:", otpError.message);
      }
      return res.status(403).json({
        message: "Please verify your email. A new code has been sent.",
        success: false,
        needsVerification: true,
        email: normalizedEmail,
      });
    }

    res.clearCookie("token", cookieOptions);
    return issueSession(res, user, `Welcome back ${user.fullname}`);
  } catch (error) {
    console.error("[Login]", error.message);
    return res.status(500).json({
      message: "Unable to login right now",
      success: false,
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
        success: false,
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        message: "Google sign-in is not configured",
        success: false,
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({
        message: "Google email is not verified",
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const googleId = payload.sub;
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user?.role === "recruiter") {
      return res.status(403).json({
        message: "Recruiter accounts are disabled. JobLeLo is for job seekers only.",
        success: false,
      });
    }

    if (user?.role === "admin") {
      return res.status(403).json({
        message: "Use admin login for ops accounts.",
        success: false,
      });
    }

    if (user) {
      user.googleId = googleId;
      user.emailVerified = true;
      if (!user.fullname && payload.name) user.fullname = payload.name;
      if (payload.picture && !user.profile?.profilePhoto) {
        user.profile = user.profile || {};
        user.profile.profilePhoto = payload.picture;
      }
      if (user.authProvider === "local" && user.password) {
        user.authProvider = "local";
      } else {
        user.authProvider = "google";
      }
      await user.save();
    } else {
      user = await User.create({
        fullname: payload.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId,
        authProvider: "google",
        emailVerified: true,
        role: "student",
        profile: {
          profilePhoto: payload.picture || "",
        },
      });
    }

    res.clearCookie("token", cookieOptions);
    return issueSession(res, user, `Welcome ${user.fullname}`);
  } catch (error) {
    console.error("[GoogleLogin]", error.message);
    return res.status(401).json({
      message: "Google sign-in failed",
      success: false,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.role === "recruiter") {
      return res
        .status(403)
        .clearCookie("token", cookieOptions)
        .json({
          message: "Recruiter accounts are disabled. JobLeLo is for job seekers only.",
          success: false,
        });
    }

    if (user.emailVerified === false && user.role === "student") {
      return res
        .status(403)
        .clearCookie("token", cookieOptions)
        .json({
          message: "Email verification required",
          success: false,
          needsVerification: true,
          email: user.email,
        });
    }

    return res.status(200).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to load session",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).clearCookie("token", cookieOptions).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to logout right now",
      success: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      fullname,
      email,
      phoneNumber,
      bio,
      skills,
      college,
      degree,
      branch,
      graduationYear,
      cgpa,
      location,
      experience,
      internships,
      projects,
      portfolio,
      linkedin,
      github,
      preferredJobRoles,
      profileCompletionSkipped,
    } = body;
    if (!fullname || !email) {
      return res.status(400).json({
        message: "Name and email are required",
        success: false,
      });
    }

    const userId = req.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.role === "recruiter") {
      return res.status(403).json({
        message: "Recruiter accounts are disabled. JobLeLo is for job seekers only.",
        success: false,
      });
    }

    user.fullname = fullname;
    user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    user.profile = user.profile || {};
    user.profile.bio = bio || "";
    user.profile.skills = toArray(skills);
    user.profile.college = college || "";
    user.profile.degree = degree || "";
    user.profile.branch = branch || "";
    user.profile.graduationYear = graduationYear || "";
    user.profile.cgpa = cgpa || "";
    user.profile.location = location || "";
    user.profile.experience = parseJsonArray(experience);
    user.profile.internships = parseJsonArray(internships);
    user.profile.projects = parseJsonArray(projects);
    user.profile.portfolio = portfolio || "";
    user.profile.linkedin = linkedin || "";
    user.profile.github = github || "";
    user.profile.preferredJobRoles = toArray(preferredJobRoles);
    user.profile.profileCompletionSkipped = profileCompletionSkipped === "true";
    user.profile.profileCompletedAt =
      profileCompletionSkipped === "true" ? user.profile.profileCompletedAt : new Date();

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: getSafeUser(user),
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to update profile",
      success: false,
    });
  }
};
