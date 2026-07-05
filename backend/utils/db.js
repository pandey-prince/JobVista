import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[DB] MONGO_URI is not set — add it in Render environment variables");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("mongodb connected successfully");
  } catch (err) {
    console.error("[DB] MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

export default connectDB;
