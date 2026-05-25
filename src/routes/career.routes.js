import express from "express";
import {
  getActiveJobs,
  getJobById,
  createJob,
  updateJob,
  toggleJobStatus,
  deleteJob,
  adminLogin,
  getAdminJobs,
} from "../controllers/job.controller.js";

import {
  applyForJob,
  getUserApplications,
  getApplicationDetails,
  getApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

import adminAuth from "../middlwares/adminAuth.middleware.js";
import verifyToken from "../middlwares/auth.middleware.js";

const router = express.Router();

// Public Routes
router.get("/jobs", getActiveJobs);
router.get("/jobs/:id", getJobById);

// Submit application (requires authentication)
router.post("/jobs/:id/apply", verifyToken, applyForJob);

// Logged-in user routes
router.get("/my-applications", verifyToken, getUserApplications); 
router.get("/my-applications/:id", verifyToken, getApplicationDetails);

// Admin Protector
router.post("/admin/login", adminLogin);

// --- Admin Protected Routes ---
router.use("/admin", adminAuth);

router.get("/admin/jobs", getAdminJobs);
router.post("/admin/jobs", createJob);
router.put("/admin/jobs/:id", updateJob);
router.patch("/admin/jobs/:id/toggle", toggleJobStatus);
router.delete("/admin/jobs/:id", deleteJob);

router.get("/admin/applications", getApplications);
router.patch("/admin/applications/:id/status", updateApplicationStatus);

export default router;