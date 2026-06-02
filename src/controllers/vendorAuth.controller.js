import Vendor from "../models/vendor.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendResetEmail from "../utils/SendResetEmail.js";
import { createAndEmitNotification } from "./notification.controller.js";
import { uploadImage } from "../config/imagekit.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID");

export const vendorSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, bio, password } = req.body;

    const exists = await Vendor.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Vendor already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const vendor = await Vendor.create({
      firstName,
      lastName,
      email,
      bio,
      password: hashed,
      status: "pending",
      currentStep: 1,

      citizenshipNumber: "",
      citizenIssueDate: null,

      citizenshipFrontPhoto: "",
      citizenshipBackPhoto: "",
      certificate: "",

      nationality: "",
      city: "",
      province: "",
      postalCode: "",
      phoneNo: "",
      skills: [],
      vendorType: "general"
    });

    return res.status(201).json({
      message: "Vendor account created!Moved to KYC form",
      vendorID: vendor._id,
      currentStep: vendor.currentStep,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const vendorLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) return res.status(400).json({ message: "Incorrect Password" });

    if (vendor.status === "pending")
      return res.status(403).json({ message: "Your account is under review" });

    if (vendor.status === "rejected")
      return res.status(403).json({ message: "Your account was rejected" });

    if (vendor.status === "blocked")
      return res.status(403).json({ message: "Your account has been blocked by the admin" });

    const token = jwt.sign(
      { id: vendor._id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await createAndEmitNotification(vendor._id, "Vendor", "You have successfully logged in", "INFO");

    res.json({ message: "Vendor login successful", token, vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const uploadKycData = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { citizenshipNumber, citizenIssueDate } = req.body;

    const updated = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        citizenshipNumber,
        citizenIssueDate,
        currentStep: 2,
      },
      { new: true },
    );

    res.json({
      message: "KYC details saved. Now proceed to upload documents",
      vendor: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const uploadFrontPhoto = async (req, res) => {
//   try {
//     const vendorId = req.params.id;

//     const updated = await Vendor.findByIdAndUpdate(
//       vendorId,
//       {
//         citizenshipFrontPhoto: req.file.filename,
//         currentStep: 3,
//       },
//       { new: true },
//     );

//     res.json({
//       message: "Front CitizenShip Photo Upload",
//       vendor: updated,
//     });
//   } catch (error) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const uploadBackPhoto = async (req, res) => {
//   try {
//     const vendorId = req.params.id;

//     const updated = await Vendor.findByIdAndUpdate(
//       vendorId,
//       {
//         citizenshipBackPhoto: req.file.filename,
//         currentStep: 3,
//       },

//       { new: true },
//     );

//     res.json({
//       message: "Back Citizenship photo upload",
//       vendor: updated,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const uploadCertificates = async (req, res) => {
//   try {
//     const vendorId = req.params.id;

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) return res.status(404).json({ message: "Vendor not found" });

//     vendor.certificatePhotos.push(req.file.filename);

//     vendor.currentStep = 3;
//     await vendor.save();

//     res.json({
//       message: "Certificate uploaded",
//       vendor,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const uploadAllDocuments = async (req, res) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Front photo
    if (req.files?.citizenshipFrontPhoto) {
      vendor.citizenshipFrontPhoto =
        req.files.citizenshipFrontPhoto[0].filename;
    }

    // Back photo
    if (req.files?.citizenshipBackPhoto) {
      vendor.citizenshipBackPhoto = req.files.citizenshipBackPhoto[0].filename;
    }

    // Certificates (multiple)
    if (req.files?.certificates) {
      req.files.certificates.forEach((file) => {
        vendor.certificates.push(file.filename);
      });
    }

    vendor.currentStep = 3;
    await vendor.save();

    res.json({
      message: "Documents uploaded successfully",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const completeVendorProfile = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { nationality, city, province, postalCode, phoneNo, skills, vendorType } =
      req.body;

    // Filter out empty skills and ensure it's an array
    const processedSkills = Array.isArray(skills) 
      ? skills.filter(s => s && s.trim() !== "") 
      : [];

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        nationality,
        city,
        province,
        postalCode,
        phoneNo,
        skills: processedSkills,
        vendorType,
        currentStep: 4,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Additional information saved. Proceed to set your availability.",
      vendor: updatedVendor,
      status: updatedVendor.status
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refillVendorSignup = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refillKyc = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorProfile = async (req, res) => {
  try {
    if (!req.vendor) {
      return res.status(401).json({ message: "Vendor authentication failed: req.vendor is missing" });
    }
    
    // We already have the vendor object from the middleware
    // Convert to plain object if it's a Mongoose document
    let vendorData;
    if (typeof req.vendor.toObject === 'function') {
      vendorData = req.vendor.toObject();
    } else {
      vendorData = JSON.parse(JSON.stringify(req.vendor));
    }
    
    // Remove sensitive info
    if (vendorData) {
      delete vendorData.password;
      delete vendorData.resetToken;
      delete vendorData.resetTokenExpiry;
    }
    
    res.json({ vendor: vendorData });
  } catch (error) {
    console.error("Error in getVendorProfile:", error);
    res.status(500).json({ 
      message: "Internal Server Error in getVendorProfile", 
      error: error.message 
    });
  }
};

export const extradata = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const getVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId).select("status");

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      status: vendor.status,
    });
  } catch (error) {
    console.error("Error in getVendorStatus:", error);
    return res.status(500).json({
      message: "Server error",
      details: error.message
    });
  }
};





export const getVendorsBySkill = async (req, res) => {
  try {
    const { service } = req.params; // e.g., Plumbing, Kitchen Cleaning, etc.
    const { city } = req.query;

    let query = {
      skills: { $regex: new RegExp(service, "i") },
      status: "approved",
    };

    if (city) {
      query.city = { $regex: new RegExp(city, "i") };
    }

    // Match vendors with the skill in their skills array, case-insensitive
    const vendors = await Vendor.find(query).select(
      "firstName lastName email phoneNo skills bio vendorType averageRating numberOfReviews location"
    );

    if (!vendors.length) {
      return res.status(404).json({ message: `No vendors found for ${service} nearby` });
    }

    res.status(200).json({ vendors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const increaseRevenue = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { $inc: { revenue: 500 } },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.status(200).json({ message: "Revenue increased", revenue: vendor.revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAverageRating = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id).select("averageRating numberOfReviews");

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.status(200).json({
      averageRating: vendor.averageRating,
      numberOfReviews: vendor.numberOfReviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const vendorForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`Searching for vendor email: ${email}`);
    const vendor = await Vendor.findOne({ email });

    if (!vendor) {
      console.log("Vendor not found");
      return res.status(400).json({ message: "Invalid email" });
    }

    console.log(`Vendor found: ${vendor._id}`);

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token for database storage
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry to vendor
    vendor.resetToken = hashedToken;
    vendor.resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await vendor.save({ validateBeforeSave: false });

    // Send email with unhashed token, passing isVendor=true
    await sendResetEmail(vendor.email, resetToken, true);

    res.json({ message: "Password reset email sent successfully" });
  } catch (err) {
    console.error("Vendor Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const vendorResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Hash the incoming token to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    console.log(`Searching for vendor with hashed token: ${hashedToken}`);
    const vendor = await Vendor.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!vendor) {
      console.log("No valid/unexpired token found for vendor");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    console.log(`Valid vendor found: ${vendor._id}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    vendor.password = hashedPassword;
    
    // Clear reset fields
    vendor.resetToken = undefined;
    vendor.resetTokenExpiry = undefined;

    await vendor.save({ validateBeforeSave: false });

    res.json({ message: "Password Reset Successfully" });
  } catch (error) {
    console.error("Vendor Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateVendorProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const vendorId = req.vendor._id;
    let vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    try {
      const uploadResponse = await uploadImage(req.file.buffer, req.file.originalname);
      vendor.profileImage = {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
      };
    } catch (uploadError) {
      console.error("ImageKit upload error:", uploadError);
      return res.status(500).json({ message: "Error uploading profile image." });
    }

    await vendor.save();

    // Return sanitized vendor data
    let vendorData = vendor.toObject();
    delete vendorData.password;
    delete vendorData.resetToken;
    delete vendorData.resetTokenExpiry;

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      vendor: vendorData
    });

  } catch (error) {
    console.error("Update vendor profile image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateVendorProfileInfo = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { firstName, lastName, phoneNo, city, province, bio, skills } = req.body;

    // Filter out empty skills and ensure it's an array
    const processedSkills = Array.isArray(skills) 
      ? skills.filter(s => s && s.trim() !== "") 
      : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(s => s !== "") : []);

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        firstName,
        lastName,
        phoneNo,
        city,
        province,
        bio,
        skills: processedSkills,
      },
      { new: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    let vendorData = updatedVendor.toObject();
    delete vendorData.password;
    delete vendorData.resetToken;
    delete vendorData.resetTokenExpiry;

    res.status(200).json({
      success: true,
      message: "Profile information updated successfully",
      vendor: vendorData
    });
  } catch (error) {
    console.error("Update vendor profile info error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const vendorGoogleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: "No credential provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    });
    
    const payload = ticket.getPayload();
    const { email, name, given_name, family_name, picture } = payload;
    
    let vendor = await Vendor.findOne({ email });
    
    if (!vendor) {
      // Create new vendor
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const safeName = name || "Vendor";
      const firstName = given_name || safeName.split(' ')[0];
      const lastName = family_name || (safeName.split(' ').length > 1 ? safeName.split(' ').slice(1).join(' ') : "");
      
      vendor = await Vendor.create({
        firstName,
        lastName,
        email,
        bio: "",
        password: hashedPassword,
        status: "pending", // Vendors might still need approval
        currentStep: 1,
        citizenshipNumber: "",
        citizenIssueDate: null,
        citizenshipFrontPhoto: "",
        citizenshipBackPhoto: "",
        certificate: "",
        nationality: "",
        city: "",
        province: "",
        postalCode: "",
        phoneNo: "",
        skills: [],
        vendorType: "general",
        profileImage: {
          url: picture,
          fileId: ""
        }
      });
      
      return res.status(201).json({
        message: "Vendor account created! Please complete your profile.",
        vendorID: vendor._id,
        currentStep: vendor.currentStep,
      });
    }

    // Existing vendor login
    if (vendor.status === "pending")
      return res.status(403).json({ message: "Your account is under review" });

    if (vendor.status === "rejected")
      return res.status(403).json({ message: "Your account was rejected" });

    if (vendor.status === "blocked")
      return res.status(403).json({ message: "Your account has been blocked by the admin" });

    const token = jwt.sign(
      { id: vendor._id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await createAndEmitNotification(vendor._id, "Vendor", "You have successfully logged in with Google", "INFO");

    res.json({ message: "Vendor login successful", token, vendor });

  } catch (error) {
    console.error("Vendor Google Auth error:", error);
    res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
};

// Gamification Leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    // Top 10 vendors sorted by averageRating (desc), then totalRatings (desc)
    const topVendors = await Vendor.find({ 
      status: "approved", 
      numberOfReviews: { $gt: 0 } 
    })
      .select("firstName lastName profileImage averageRating numberOfReviews currentBadge achievements skills city")
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(10);

    res.status(200).json({ success: true, leaderboard: topVendors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};