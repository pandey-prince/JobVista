import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
dotenv.config({});
const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// const corsOption = {
//     origin : "http://localhost:5173"
// }
app.use(cors());

app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

app.get("/home", (req, res) => {
  return res.status(200).json({
    message: "I am coming form backend",
    success: true,
  });
});
const PORT = 3000 || process.env.PORT;
app.listen(PORT, () => {
  connectDB();
  console.log(`server is listening at ${PORT}`);
});
