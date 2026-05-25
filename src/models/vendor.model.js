import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      url: String,
      fileId: String
    },

    citizenshipNumber: String,
    citizenIssueDate: Date,

    citizenshipFrontPhoto: String,
    citizenshipBackPhoto: String,
    certificates: [String],

    nationality: String,
    city: String,
    province: String,
    postalCode: String,
    phoneNo: String,
    bio: String,
    skills: { type: [String], required: true },
    vendorType: { type: String, default: "general" },

    currentStep: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [85.324, 27.717], // Default to Kathmandu
      },
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    cancellationRate: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: Number, // average in minutes
      default: 0,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
    isBlockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'blockedUsersModel'
    }],
    blockedUsersModel: {
      type: String,
      enum: ['User', 'Vendor'],
      default: 'User'
    }
  },
  { timestamps: true },
);

vendorSchema.index({ location: "2dsphere" });

export default mongoose.model("Vendor", vendorSchema);
