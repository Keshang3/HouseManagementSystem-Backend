import Vendor from "../models/vendor.model.js";
import jwt from "jsonwebtoken";
import { io } from "../socket.js";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: "admin", id: "super_admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ 
      success: true,
      message: "Admin Login Successful",
      token,
      role: "admin"
    });
  }
  res.status(401).json({ message: "Invalid admin credentials" });
};

export const pendingVendor = async (req, res) => {
  try {
    const pendingVendor = await Vendor.find({ status: "pending" });
    res.json({ success: true, vendors: pendingVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).sort({ createdAt: -1 });
    res.json({ success: true, vendors });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const approveVendor = async (req, res) => {
  try {
    const approveVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!approveVendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.json({ success: true, message: "Vendor approved", vendor: approveVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const rejectVendor = async (req, res) => {
  try {
    const rejectVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!rejectVendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.json({ success: true, message: "Vendor rejected", vendor: rejectVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const blockVendor = async (req, res) => {
  try {
    const blockedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: "blocked" },
      { new: true }
    );
    if (!blockedVendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    
    // Notify the vendor to log them out immediately
    if (io) {
        io.to(req.params.id.toString()).emit("account_blocked");
    }

    res.json({ success: true, message: "Vendor blocked", vendor: blockedVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const unblockVendor = async (req, res) => {
  try {
    const unblockedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!unblockedVendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.json({ success: true, message: "Vendor unblocked", vendor: unblockedVendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
