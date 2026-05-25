import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: false,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: String,
      required: true,
    },

    date: {
      type: String, // String format YYYY-MM-DD as per request
      required: true,
    },

    time: {
      type: String, // String format HH:MM as per request
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    locationName: {
      type: String,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    problemDescription: String, // Keeping this for extra detail

    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "pending_confirmation", "completed", "cancelled"],
      default: "pending",
    },
    price: {
      type: Number,
      default: 499,
    },
    isCompletedRewarded: {
      type: Boolean,
      default: false,
    },
    isRatedRewarded: {
      type: Boolean,
      default: false,
    },
    isReviewRewarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Booking", bookingSchema);
