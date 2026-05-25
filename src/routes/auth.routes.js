import express from "express";
import {
  signUp,
  logIn,
  // logOut,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  toggleFavourite,
  getFavourites,
} from "../controllers/auth.controllers.js";
import { createBooking, getUserBookings, getBookingDetails, updateBookingStatus, userConfirmCompletion } from "../controllers/booking.controller.js";
import { upload } from '../middlwares/multer.js';
import authMiddleware from "../middlwares/auth.middleware.js";
import { getServices } from "../controllers/service.controller.js";
import { getVendorAvailableSlots } from "../controllers/vendorAvailability.controllers.js";
import { createReview, getVendorReviews, getFeaturedReviews } from "../controllers/review.controller.js";


const authRouter = express.Router();

authRouter.get("/vendor/:vendorId/slots/:date", authMiddleware, getVendorAvailableSlots);

authRouter.post("/signup", (req, res, next) => {
  console.log("--- REQUEST REACHED ROUTER ---");
  console.log("Content-Type:", req.headers['content-type']);
  next();
}, upload.single("profileImage"), signUp);
authRouter.get("/verify", verifyEmail);
authRouter.get("/profile", authMiddleware, getUserProfile);
authRouter.put("/profile", authMiddleware, upload.single("profileImage"), updateUserProfile);
authRouter.put("/update-password", authMiddleware, updatePassword);
authRouter.post("/login", logIn);
authRouter.post("/forgotpassword", forgotPassword);
authRouter.post("/resetpassword/:token", resetPassword);

authRouter.post("/createbooking", authMiddleware, createBooking);

authRouter.post("/services", authMiddleware, getServices);

authRouter.get("/favourites", authMiddleware, getFavourites);
authRouter.post("/favourite/:serviceName", authMiddleware, toggleFavourite);

authRouter.get("/my-bookings", authMiddleware, getUserBookings);
authRouter.get("/booking/:bookingId", authMiddleware, getBookingDetails);

// User cancel booking
authRouter.put("/booking/:bookingId/cancel", authMiddleware, (req, res, next) => {
  req.body.status = "cancelled";
  next();
}, updateBookingStatus);

authRouter.put("/booking/:bookingId/confirm-completion", authMiddleware, userConfirmCompletion);

authRouter.post("/booking/:bookingId/review", authMiddleware, createReview);
authRouter.get("/reviews/featured", getFeaturedReviews);
authRouter.get("/vendor/:vendorId/reviews", getVendorReviews);

export default authRouter;






