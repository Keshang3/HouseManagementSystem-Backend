import express from "express";
import { createReview, getVendorReviews, getServiceReviews } from "../controllers/review.controller.js";
import authMiddleware from "../middlwares/auth.middleware.js"; // Assuming authMiddleware for user authentication

const reviewRouter = express.Router();

reviewRouter.post("/:bookingId", authMiddleware, createReview);
reviewRouter.get("/vendor/:vendorId", getVendorReviews);
reviewRouter.get("/service/:serviceName", getServiceReviews);

export default reviewRouter;
