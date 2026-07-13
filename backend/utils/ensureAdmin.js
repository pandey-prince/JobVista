import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";

/**
 * Create or update ops admin from ADMIN_EMAIL / ADMIN_PASSWORD env.
 * Safe to call on boot (free Render has no Shell).
 * Skips quietly when env vars are missing.
 */
export const ensureAdminFromEnv = async () => {
  const email = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullname = process.env.ADMIN_FULLNAME || "JobLeLo Admin";
  const phoneNumber = Number(process.env.ADMIN_PHONE || "9000000000");

  if (!email || !password) {
    console.log("[Admin] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed");
    return { skipped: true };
  }

  if (password.length < 8) {
    console.warn("[Admin] ADMIN_PASSWORD must be at least 8 characters — skipping");
    return { skipped: true };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.fullname = fullname;
    existing.phoneNumber = phoneNumber;
    existing.role = "admin";
    existing.password = hashedPassword;
    existing.emailVerified = true;
    existing.authProvider = "local";
    await existing.save();
    console.log(`[Admin] Updated admin user: ${email}`);
    return { updated: true, email };
  }

  await User.create({
    fullname,
    email,
    phoneNumber,
    role: "admin",
    password: hashedPassword,
    emailVerified: true,
    authProvider: "local",
  });
  console.log(`[Admin] Created admin user: ${email}`);
  return { created: true, email };
};
