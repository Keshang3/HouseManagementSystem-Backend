

import { Application } from "../models/Application.model.js";
import { Job } from "../models/Job.model.js";
import {
  sendApplicationConfirmation,
  sendAdminNotification,
  sendStatusUpdateEmail,
} from "../utils/CareerEmail.js";
import imagekit from "../config/imagekit.js";
import { createAndEmitNotification } from "./notification.controller.js";

// Public: Apply for a job
export const applyForJob = async (req, res) => {
  try {
    const { name, email, phone, address, coverLetter, linkedinUrl, portfolioUrl, company } = req.body;
    const jobId = req.params.id;
    const userId = req.user._id;

    // Get job details for the application record
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job position not found" });
    }

    const existingApplication = await Application.findOne({ jobId, userId });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: "You have already applied for this job." });
    }

    const application = await Application.create({
      jobId,
      userId,
      jobTitle: job.title,
      company: company || job.company || "Unknown Company",
      name,
      email,
      phone,
      address,
      coverLetter,
      linkedinUrl: linkedinUrl || "",
      portfolioUrl: portfolioUrl || "",
      status: "pending"
    });

    // Send Emails (Non-blocking)
    sendApplicationConfirmation(email, name, job.title).catch(e => console.error("Email error:", e.message));
    sendAdminNotification({ name, email, phone }, job.title, "").catch(e => console.error("Admin notification error:", e.message));

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: application,
    });
  } catch (error) {
    console.error("APPLICATION SUBMISSION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Admin: Get all applications (optional but common)
export const getApplications = async (req, res) => {
  try {
    const { jobId, status } = req.query;
    const filter = {};
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate("jobId", "title department location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin applications",
      error: error.message,
    });
  }
};

// Logged-in User: Get their OWN applications
export const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate("jobId")
      .sort({ createdAt: -1 }); // Specifications mentions appliedAt, using timestamps
    
    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user applications",
      error: error.message,
    });
  }
};

// Logged-in User: Get details + status of a specific application
export const getApplicationDetails = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id   // ensures user can only view their own
    }).populate('jobId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching application details",
      error: error.message,
    });
  }
};

// Admin: Update status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, interviewDate, adminNote } = req.body;
    
    // Create an update object dynamically
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Map new status names to email template if needed, or send as is
    if (status) {
      sendStatusUpdateEmail(
        application.email,
        application.name,
        application.jobTitle,
        application.status
      ).catch((err) =>
        console.error("Status email error:", err.message)
      );
    }

    // Create in-app notification using combined data from the updated document
    let notificationMessage = `Your application has been ${application.status}.`;
    if (application.adminNote && application.adminNote.trim() !== "") {
      notificationMessage += ` Admin Comment: ${application.adminNote}`;
    }
    const link = `/dashboard/my-applications/${application._id}`;
    
    await createAndEmitNotification(
      application.userId,
      "User",
      notificationMessage,
      "INFO",
      link
    );

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};