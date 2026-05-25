import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  profileImage: {
    url: String,
    fileId: String
  },
  phoneNo: {
    type: String
  },
  address: {
    type: String
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ["Bronze", "Silver", "Gold", "Platinum"],
    default: "Bronze"
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  reviewsGiven: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  streak: {
    type: Number,
    default: 0
  },
  lastLoginDate: {
    type: Date
  },
  favourites: [{
    type: String
  }],
  isBlockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'blockedUsersModel'
  }],
  blockedUsersModel: {
    type: String,
    enum: ['User', 'Vendor'],
    default: 'Vendor'
  }

},

  { timestamps: true })

const User = mongoose.model("User", userSchema);
export default User;
