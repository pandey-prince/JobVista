import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      required: true,
    },
    profile: {
      bio: { type: String },
      skills: [{ type: String }],
      college: { type: String },
      degree: { type: String },
      branch: { type: String },
      graduationYear: { type: String },
      cgpa: { type: String },
      location: { type: String },
      experience: [
        {
          title: { type: String },
          company: { type: String },
          duration: { type: String },
          description: { type: String },
        },
      ],
      internships: [
        {
          title: { type: String },
          company: { type: String },
          duration: { type: String },
          description: { type: String },
        },
      ],
      projects: [
        {
          title: { type: String },
          link: { type: String },
          description: { type: String },
        },
      ],
      portfolio: { type: String },
      linkedin: { type: String },
      github: { type: String },
      preferredJobRoles: [{ type: String }],
      profileCompletionSkipped: { type: Boolean, default: false },
      profileCompletedAt: { type: Date },
      resume: { type: String },
      resumeOriginalName: { type: String },
      company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      profilePhoto: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
