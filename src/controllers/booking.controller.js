import Vendor from "../models/vendor.model.js";
import Booking from "../models/booking.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { rewardUser } from "../services/gamification.service.js";
import { createAndEmitNotification } from "./notification.controller.js";

// --- User Actions ---

export const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    // Align with UnifiedBookingPage.jsx keys
    const {
      serviceName,
      serviceDate,
      startTime,
      endTime, // Added for completeness, though model might need update
      address,
      problemDescription,
      vendorId,
      price,
      latitude,
      longitude,
      locationName
    } = req.body;

    const service = serviceName || req.body.service;
    const date = serviceDate || req.body.date;
    const time = startTime || req.body.time;

    if (!service || !date || !time || !address) {
      return res.status(400).json({ message: "Missing required fields (service, date, time, address)" });
    }

    const bookingData = {
      userId,
      service,
      date,
      time,
      address,
      problemDescription,
      status: vendorId ? "confirmed" : "pending",
      vendorId: vendorId || null,
      price: price || 499,
      latitude,
      longitude,
      locationName,
    };

    const booking = await Booking.create(bookingData);

    // Gamification: No points for booking creation based on new rules

    await createAndEmitNotification(userId, "User", "Your service has been booked", "SUCCESS");
    if (vendorId) {
      await createAndEmitNotification(vendorId, "Vendor", "You have a new booking request", "INFO");
    }

    res.status(201).json({
      message: "Booking request created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ userId })
      .populate("vendorId", "firstName lastName email phoneNo service")
      .sort({ createdAt: -1 });

    // For each booking, check if it's already reviewed
    const bookingIds = bookings.map(b => b._id);
    const reviews = await Review.find({ bookingId: { $in: bookingIds } });
    const reviewedBookingIds = new Set(reviews.map(r => r.bookingId.toString()));

    const bookingsWithReviewFlag = bookings.map(b => {
      const bObj = b.toObject();
      bObj.isReviewed = reviewedBookingIds.has(b._id.toString());
      return bObj;
    });

    res.status(200).json({ bookings: bookingsWithReviewFlag });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const userConfirmCompletion = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or you do not have permission" });
    }

    if (booking.status !== "pending_confirmation") {
      return res.status(400).json({ message: "Booking must be in 'pending_confirmation' status to be confirmed" });
    }

    booking.status = "completed";

    // Gamification: Award 30 points for completion ONLY if not already rewarded
    let gamificationUpdate = null;
    if (!booking.isCompletedRewarded) {
      gamificationUpdate = await rewardUser(userId, "COMPLETE_SERVICE");
      booking.isCompletedRewarded = true;
    }

    await booking.save();

    // Increment vendor revenue
    if (booking.vendorId) {
      await Vendor.findByIdAndUpdate(booking.vendorId, { $inc: { revenue: 500, totalJobs: 1 } });
    }

    res.status(200).json({
      message: "Booking confirmed as completed",
      booking,
      gamificationUpdate: { rewardResult: gamificationUpdate }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Vendor Actions ---

export const getAvailableBookings = async (req, res) => {
  try {
    // Vendors can see all pending bookings
    const bookings = await Booking.find({ status: "pending" })
      .populate("userId", "fullName userName email phoneNo profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.vendor._id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is no longer available" });
    }

    booking.vendorId = vendorId;
    booking.status = "confirmed";
    await booking.save();

    await createAndEmitNotification(booking.userId, "User", "Vendor accepted your request", "SUCCESS");

    res.status(200).json({
      message: "Booking accepted successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startService = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.vendor._id;

    const booking = await Booking.findOne({ _id: bookingId, vendorId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not assigned to you" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking must be in 'confirmed' status to start" });
    }

    booking.status = "in_progress";
    await booking.save();

    res.status(200).json({
      message: "Service marked as in progress",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const vendorMarkAsCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.vendor._id;

    const booking = await Booking.findOne({ _id: bookingId, vendorId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not assigned to you" });
    }

    if (booking.status !== "in_progress") {
      return res.status(400).json({ message: "Booking must be in 'in_progress' status to be marked as finished" });
    }

    booking.status = "pending_confirmation";
    await booking.save();

    await createAndEmitNotification(
      booking.userId,
      "User",
      "Your vendor has marked the service as finished. Please confirm whether the job has been completed successfully.",
      "INFO"
    );

    res.status(200).json({
      message: "Booking submitted for user confirmation",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.vendor._id;

    const booking = await Booking.findOne({ _id: bookingId, vendorId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not assigned to you" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Booking rejected/cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const bookings = await Booking.find({ vendorId })
      .populate("userId", "fullName userName email phoneNo profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Common Actions ---

export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("vendorId", "firstName lastName email phoneNo service")
      .populate("userId", "fullName userName email phoneNo profileImage");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if reviewed
    const review = await Review.findOne({ bookingId });
    const bookingObj = booking.toObject();
    bookingObj.isReviewed = !!review;

    res.status(200).json({ booking: bookingObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update status (General purpose)
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "in_progress", "pending_confirmation", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Protection: Cannot modify after completion (except by admin override - which we handle in admin controller)
    if (booking.status === "completed" && status !== "completed") {
      return res.status(400).json({ message: "Cannot modify a completed booking" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // If status changed to completed, increment vendor revenue and handle gamification
    if (oldStatus !== "completed" && status === "completed") {
      if (booking.vendorId) {
        await Vendor.findByIdAndUpdate(booking.vendorId, { $inc: { revenue: 500, totalJobs: 1 } });
      }
      
      // Gamification for User
      if (!booking.isCompletedRewarded) {
        await rewardUser(booking.userId, "COMPLETE_SERVICE");
        booking.isCompletedRewarded = true;
        await booking.save(); // Save again to store flag
      }
    }

    res.status(200).json({ message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Utility (from old code if still needed) ---

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: "approved" }).select(
      "name service email phone"
    );
    res.status(200).json({ vendors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
