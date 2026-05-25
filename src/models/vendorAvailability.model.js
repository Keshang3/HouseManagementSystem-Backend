import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: String,
    endTime: String,
  },
  { _id: false },
);

const vendorAvailabilitySChema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    // NEW: Detailed weekly configuration
    dailyConfig: [{
      day: String,
      isWorking: Boolean,
      startTime: String,
      endTime: String,
      selectedSlots: [String]
    }],
    // NEW: Specific blocked dates (YYYY-MM-DD)
    blockedDates: [String],

    // Legacy fields
    availableFrom: Date,
    availableTo: Date,
    workingDays: [String],
    timeSlots: [timeSlotSchema],
  },
  { timestamps: true },
);

export default mongoose.model("vendorAvailability", vendorAvailabilitySChema);
