/**
 * Create or update the JobLeLo ops admin account.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in env.
 * Free Render: no Shell needed — admin is also seeded on server boot.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ensureAdminFromEnv } from "../utils/ensureAdmin.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await ensureAdminFromEnv();
  if (result.skipped) {
    process.exit(1);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("seed-admin failed:", error.message);
  process.exit(1);
});
