import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import chatbotRoute from "./routes/chatbot.route.js";
import scrapedJobRoute from "./routes/scrapedJob.route.js";
import careerSourceRoute from "./routes/careerSource.route.js";
import statsRoute from "./routes/stats.route.js";
import { startScrapeScheduler } from "./jobs/scrapeScheduler.js";
import { seedDefaultJobSources } from "./utils/seedJobSources.js";
dotenv.config({});
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedOrigins = new Set(
  [
    "https://job-vista-eta.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/chatbot", chatbotRoute);
app.use("/api/v1/scraped-jobs", scrapedJobRoute);
app.use("/api/v1/career-sources", careerSourceRoute);
app.use("/api/v1/stats", statsRoute);

app.get("/home", (req, res) => {
  return res.status(200).json({
    message: "I am coming form backend",
    success: true,
  });
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  await connectDB();
  await seedDefaultJobSources();
  startScrapeScheduler();
  console.log(`server is listening at ${PORT}`);
});
