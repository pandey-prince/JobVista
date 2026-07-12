/**
 * Create or update the JobVista ops admin account.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in env.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";

dotenv.config();

const run = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullname = process.env.ADMIN_FULLNAME || "JobLeLo Admin";
  const phoneNumber = Number(process.env.ADMIN_PHONE || "9000000000");

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.fullname = fullname;
    existing.phoneNumber = phoneNumber;
    existing.role = "admin";
    existing.password = hashedPassword;
    await existing.save();
    console.log(`Updated admin user: ${email}`);
  } else {
    await User.create({
      fullname,
      email,
      phoneNumber,
      role: "admin",
      password: hashedPassword,
    });
    console.log(`Created admin user: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("seed-admin failed:", error.message);
  process.exit(1);
});
