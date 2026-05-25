import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String,
      required: false,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "interview_scheduled", "accepted", "rejected"],
      default: "pending",
    },
    interviewDate: {
      type: Date,
    },
    recruiterNote: {
      type: String,
      default: "",
    },
    adminNote: { // Kept for compatibility if needed, but spec uses recruiterNote
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Application = mongoose.model("Application", applicationSchema);
