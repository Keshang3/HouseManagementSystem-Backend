import generateToken from "../config/token.js";
import User from "../models/user.model.js";
import Vendor from "../models/vendor.model.js";

import bcrypt from "bcrypt";
import sendVerificationEmail from "../utils/SendEmail.js";
import sendResetEmail from "../utils/SendResetEmail.js";
import generateEmailVerifyToken from "../config/generateEmailVerifyToken.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadImage } from "../config/imagekit.js";
import { createAndEmitNotification } from "./notification.controller.js";
import { processDailyLogin } from "../services/gamification.service.js";

export const signUp = async (req, res) => {
  console.log("=== SIGNUP START ===");
  console.log("Signup Request Body:", req.body);
  console.log("Signup Request File:", req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : "No file");

  try {
    const { fullName, email, password, userName } = req.body;

    if (!fullName || !email || !password || !userName) {
      const missing = [];
      if (!fullName) missing.push("fullName");
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!userName) missing.push("userName");
      return res.status(400).json({ message: `Missing details: ${missing.join(", ")}` });
    }

    console.log("Checking if email exists...");
    const existsEmail = await User.findOne({ email });
    if (existsEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    console.log("Checking if username exists...");
    const existsUserName = await User.findOne({ userName });
    if (existsUserName) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImage = {};

    if (req.file) {
      try {
        console.log("Uploading image to ImageKit...");
        const uploadResponse = await uploadImage(req.file.buffer, req.file.originalname);
        profileImage = {
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
        };
        console.log("Image uploaded successfully:", uploadResponse.url);
      } catch (uploadError) {
        console.warn("WARNING: ImageKit upload failed, but continuing with signup.");
        console.error("ImageKit upload error DETAILS:", uploadError);
        // We continue without profileImage, but we can add a flag to tell the user
        req.imageUploadError = uploadError.message || "Image upload failed";
      }
    }

    console.log("Creating new user in DB...");
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      userName,
      profileImage,
    });
    console.log("User created in DB:", newUser._id);

    let emailToken;
    console.log("Generating email verify token...");
    emailToken = generateEmailVerifyToken(newUser._id);
    console.log("Email token generated");

    console.log("Sending verification email...");
    try {
      await sendVerificationEmail(email, emailToken);
      console.log("Verification email sent");
    } catch (emailError) {
      console.error("Email sending error DETAILS:", emailError);
      return res.status(500).json({
        message: "Registration successful, but failed to send verification email. check SMTP config.",
        error: emailError.message || emailError
      });
    }

    console.log("Signup process completed successfully");
    return res.status(201).json({
      message: "Registration successful. Please check your email for the verification link.",
      warning: req.imageUploadError,
      user: {
        fullName,
        email,
        userName,
      }
    });

  } catch (error) {
    console.error("Signup outer catch error DETAILS:", error);
    return res.status(500).json({
      message: error.message || "internal server error",
      details: error
    });
  }
};




export const verifyEmail = async (req, res) => {
  try {
    const { emailToken } = req.query;
    if (!emailToken) {
      return res.status(400).json({ message: "Verification token is required" });
    }
    const decoded = jwt.verify(emailToken, process.env.JWT_EMAIL_SECRET);
    if (decoded.purpose !== "email_verify") {
      return res.status(400).json({ message: "Invalid token" });
    }
    const user = await User.findById(decoded._id)
    if (!user) return res.status(400).json({ message: "User not found!" });

    user.isVerified = true;
    await user.save();
    res.json({ message: "Email Verified Succesfully , Please LogIn" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(400).json({ message: "Invalid or expired verification link" });
  }
}










export const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    let existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(400).json({ message: " User not found " })
    }

    if (!existUser.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }
    let match = await bcrypt.compare(password, existUser.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    const token = generateToken(existUser._id);


    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENVIRONMENT == "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await createAndEmitNotification(existUser._id, "User", "You have successfully logged in", "INFO");

    // Check daily login & streak
    await processDailyLogin(existUser._id);

    return res.status(200).json({
      token,
      success: true,
      message: "Login Successful",
      user: {
        _id: existUser._id,
        fullName: existUser.fullName,
        email: existUser.email,
        userName: existUser.userName,
        profileImage: existUser.profileImage,
        phoneNo: existUser.phoneNo,
        address: existUser.address,
      },
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};



export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`Searching for email: ${email}`);
    // Check ONLY User collection
    let account = await User.findOne({ email });

    if (!account) {
      console.log("Account not found in User collection");
      return res.status(400).json({ message: "Invalid email" });
    }

    console.log(`Account found in User collection: ${account._id}`);

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");


    // Hash token for database storage
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry to account
    account.resetToken = hashedToken;
    account.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await account.save({ validateBeforeSave: false });

    // Send email with unhashed token
    await sendResetEmail(account.email, resetToken);

    res.json({ message: "Password reset email sent successfully" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Hash the incoming token to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Search ONLY User collection
    console.log(`Searching for user with hashed token: ${hashedToken}`);
    let account = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!account) {
      console.log("No valid/unexpired token found in User collection");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    console.log(`Valid account found: ${account._id}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    account.password = hashedPassword;
    
    // Clear reset fields
    account.resetToken = undefined;
    account.resetTokenExpiry = undefined;

    await account.save({ validateBeforeSave: false });

    res.json({ message: "Password Reset Successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetToken -resetTokenExpiry');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process daily login on profile fetch to keep gamification updated
    const gamificationUpdate = await processDailyLogin(user._id);

    // Re-fetch user in case points or streak updated
    const updatedUser = await User.findById(req.user._id).select('-password -resetToken -resetTokenExpiry');

    res.status(200).json({ success: true, user: updatedUser, gamificationUpdate });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, userName, phoneNo, address } = req.body;
    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (userName) user.userName = userName;
    if (phoneNo !== undefined) user.phoneNo = phoneNo;
    if (address !== undefined) user.address = address;

    if (req.file) {
      try {
        const uploadResponse = await uploadImage(req.file.buffer, req.file.originalname);
        user.profileImage = {
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
        };
      } catch (uploadError) {
        console.error("ImageKit upload error:", uploadError);
        return res.status(500).json({ message: "Error uploading profile image." });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        phoneNo: user.phoneNo,
        address: user.address,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await createAndEmitNotification(user._id, "User", "Your password was updated successfully", "INFO");

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFavourite = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const userId = req.user._id;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFavourited = user.favourites.includes(serviceName);
    
    if (isFavourited) {
      user.favourites = user.favourites.filter(name => name !== serviceName);
    } else {
      user.favourites.push(serviceName);
    }

    await user.save();

    const msg = isFavourited ? `Removed ${serviceName} from favourites` : `Added ${serviceName} to favourites`;
    await createAndEmitNotification(userId, "User", msg, "SUCCESS");

    res.status(200).json({
      success: true,
      message: isFavourited ? "Service removed from favourites" : "Service added to favourites",
      favourites: user.favourites
    });
  } catch (error) {
    console.error("Toggle favourite error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFavourites = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('favourites');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      favourites: user.favourites || []
    });
  } catch (error) {
    console.error("Get favourites error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};