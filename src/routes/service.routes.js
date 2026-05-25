import express from "express";
import {
  getServices,
  getAllServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";
import adminAuth from "../middlwares/adminAuth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getServices);

// Admin only routes
router.use(adminAuth);
router.get("/all", getAllServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;
