import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const getSafeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
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

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullname,
      email,
      phoneNumber,
      role: "student",
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json({
        message: "Account created successfully.",
        success: true,
        user: getSafeUser(newUser),
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// export const login = async (req, res) => {
//   try {
//     // res.clearCookie("token");
//     const { email, password, role } = req.body;
//     if (!email || !password || !role) {
//       return res.status(400).json({
//         message: "Something is missing",
//         success: false,
//       });
//     }
//     let user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         message: "Incorrect email or password",
//         message: false,
//       });
//     }
//     const isPasswordMatch = bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       return res.status(400).json({
//         message: "Incorrect email or password.",
//         success: false,
//       });
//     }
//     if (role !== user.role) {
//       return res.status(400).json({
//         message: "Account doesn't exits with current role",
//         success: false,
//       });
//     }
//     const tokenData = {
//       userId: user._id,
//     };
//     const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
//       expiresIn: "2d",
//     });

//     user = {
//       _id: user._id,
//       fullname: user.fullname,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       role: user.role,
//     };

//     return res
//       .status(200)
//       .cookie("token", token, {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: false,
//         maxAge: 1 * 24 * 60 * 60 * 1000,
//       })
//       .json({
//         message: `Welcome back ${user.fullname}`,
//         success: true,
//         user,
//       });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    let user = await User.findOne({ email });

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

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    res.clearCookie("token", cookieOptions);

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({
        message: `Welcome back ${user.fullname}`,
        success: true,
        user: getSafeUser(user),
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to login right now",
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
    console.log("request came to logout");
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };
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

// export const logout = async (req, res) => {
//   try {
//     console.log("request came to logout");

//     return res.status(200).cookie("token", "", { maxAge: 0 }).json({
//       message: "Logged out successfully",
//       success: true,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };
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
    if (!fullname || !email || !phoneNumber) {
      return res.status(400).json({
        message: "Name, email and phone number are required",
        success: false,
      });
    }

    //cloudnery ayega idher

    const userId = req.id; //middlewar authentciation

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

    //updating data
    user.fullname = fullname;
    user.email = email;
    user.phoneNumber = phoneNumber;
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

    //remove comes here later

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
