import mongoose from "mongoose";

const userCompanyListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobSource",
      default: null,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    careerUrl: {
      type: String,
      default: "",
      trim: true,
    },
    listType: {
      type: String,
      enum: ["watchlist", "wishlist"],
      required: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

userCompanyListSchema.index(
  { user: 1, jobSource: 1, listType: 1 },
  { unique: true, partialFilterExpression: { jobSource: { $type: "objectId" } } }
);

userCompanyListSchema.index(
  { user: 1, companyName: 1, listType: 1 },
  { unique: true, partialFilterExpression: { jobSource: null } }
);

export const UserCompanyList = mongoose.model(
  "UserCompanyList",
  userCompanyListSchema
);
