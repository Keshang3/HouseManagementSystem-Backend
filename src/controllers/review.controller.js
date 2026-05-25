import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import Vendor from "../models/vendor.model.js";
import User from "../models/user.model.js";
import { rewardUser } from "../services/gamification.service.js";
import { createAndEmitNotification } from "./notification.controller.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }
    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment is required" });
    }

    // Check if booking exists and belongs to the user
    // We populate vendorId to get access to it easily
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found or you don't have permission" });
    }

    // Check if status is completed (case-insensitive)
    if (booking.status?.toLowerCase() !== "completed") {
      return res.status(400).json({ message: "You can only review completed bookings" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review for this booking" });
    }

    // Create the review
    const review = await Review.create({
      bookingId,
      userId,
      vendorId: booking.vendorId,
      rating,
      comment: comment.trim(),
    });

    // Update vendor aggregate ratings atomically
    // We use findByIdAndUpdate with $inc for concurrency safety
    const updatedVendor = await Vendor.findByIdAndUpdate(
      booking.vendorId,
      {
        $inc: {
          totalRatings: rating,
          numberOfReviews: 1,
        },
      },
      { new: true } // Get the updated document to calculate average
    );

    if (updatedVendor) {
      // Recalculate averageRating
      updatedVendor.averageRating = updatedVendor.totalRatings / updatedVendor.numberOfReviews;
      await updatedVendor.save();
    }

    // Gamification: Add points to user for leaving a review (rating + review text)
    let gamificationUpdate = null;
    let pointsAdded = 0;
    
    if (!booking.isRatedRewarded) {
        const rateResult = await rewardUser(userId, "RATE");
        if (rateResult) pointsAdded += rateResult.pointsAdded;
        booking.isRatedRewarded = true;
    }
    if (!booking.isReviewRewarded) {
        const reviewResult = await rewardUser(userId, "REVIEW");
        if (reviewResult) {
            gamificationUpdate = reviewResult;
            pointsAdded += reviewResult.pointsAdded;
            gamificationUpdate.pointsAdded = pointsAdded; // combine points
        }
        booking.isReviewRewarded = true;
    }
    await booking.save();

    // Removed vendor gamification

    await createAndEmitNotification(userId, "User", "Review submitted successfully", "SUCCESS");
    await createAndEmitNotification(booking.vendorId, "Vendor", "You received a new review", "INFO");

    res.status(201).json({
      message: "Review submitted successfully",
      review,
      gamificationUpdate: { rewardResult: gamificationUpdate }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Review already exists for this booking." });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const reviews = await Review.find({ vendorId })
      .populate({ path: 'userId', model: 'User', select: 'fullName userName profileImage' })
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .populate({ path: 'userId', model: 'User', select: 'fullName userName profileImage' })
      .populate("vendorId", "service")
      .sort({ createdAt: -1 })
      .limit(6);
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceReviews = async (req, res) => {
  try {
    const { serviceName } = req.params;
    
    // 1. Fetch reviews with user details
    const reviews = await Review.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking"
        }
      },
      { $unwind: "$booking" },
      { $match: { "booking.service": serviceName } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          "user._id": 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.userName": 1,
          "user.profilePicture": 1,
          "user.avatar": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // 2. Calculate summary statistics
    let totalReviews = reviews.length;
    let averageRating = 0;
    let ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      let sum = 0;
      reviews.forEach(r => {
        sum += r.rating;
        if (r.rating >= 1 && r.rating <= 5) {
          ratingBreakdown[Math.floor(r.rating)] += 1;
        }
      });
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    res.status(200).json({
      success: true,
      reviews,
      summary: {
        averageRating,
        totalReviews,
        ratingBreakdown
      }
    });

  } catch (error) {
    console.error("Error in getServiceReviews:", error);
    res.status(500).json({ message: error.message });
  }
};
