import express from "express";
import { submitComplaint, getAllComplaints, updateComplaintStatus, getVendorComplaints } from "../controllers/complaint.controller.js";
import authMiddleware from "../middlwares/auth.middleware.js";
import adminAuth from "../middlwares/adminAuth.middleware.js";
import { upload as memoryUpload } from "../middlwares/multer.js";

const complaintRoutes = express.Router();

// User routes
complaintRoutes.post("/submit", authMiddleware, memoryUpload.single("attachment"), submitComplaint);

// Admin routes
complaintRoutes.get("/all", adminAuth, getAllComplaints);
complaintRoutes.patch("/status/:id", adminAuth, updateComplaintStatus);

// Common or specific (admin can fetch vendor specific complaints)
complaintRoutes.get("/vendor/:vendorId", adminAuth, getVendorComplaints);

export default complaintRoutes;
