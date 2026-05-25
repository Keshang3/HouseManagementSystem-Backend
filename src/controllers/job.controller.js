import { Job } from "../models/Job.model.js";
import jwt from "jsonwebtoken";

// Public: Get all active jobs
export const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active jobs",
      error: error.message,
    });
  }
};

// Public: Get single job by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching job details",
      error: error.message,
    });
  }
};

// Admin: Create new job
export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating job",
      error: error.message,
    });
  }
};

// Admin: Update job
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating job",
      error: error.message,
    });
  }
};

// Admin: Toggle job active status
export const toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    job.isActive = !job.isActive;
    await job.save();
    res.status(200).json({
      success: true,
      message: `Job status toggled to ${job.isActive ? "active" : "inactive"}`,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling job status",
      error: error.message,
    });
  }
};

// Admin: Delete job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting job",
      error: error.message,
    });
  }
};

// Admin: Login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { email: email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token: token,
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials",
    });
  }
};

// Admin: Fetch all jobs for dashboard
export const getAdminJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin jobs",
      error: error.message,
    });
  }
};
