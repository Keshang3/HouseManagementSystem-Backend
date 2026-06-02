import Complaint from "../models/complaint.model.js";
import Vendor from "../models/vendor.model.js";
import { uploadImage } from "../config/imagekit.js";
import { io } from "../socket.js";

// Submit a new complaint (User)
export const submitComplaint = async (req, res) => {
  try {
    const { vendorId, bookingId, message } = req.body;
    const userId = req.user.id; // from userAuth middleware

    let attachmentUrl = null;

    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, req.file.originalname);
      attachmentUrl = uploadResult.url;
    }

    const complaint = new Complaint({
      user: userId,
      vendor: vendorId,
      booking: bookingId || null,
      message,
      attachment: attachmentUrl,
    });

    await complaint.save();

    // Emit event to Admin (assuming super_admin listens to global alerts)
    if (io) {
      io.to("super_admin").emit("new_complaint", complaint);
    }

    res.status(201).json({ success: true, message: "Your complaint has been submitted successfully and is under review.", complaint });
  } catch (error) {
    console.error("Complaint submission error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all complaints (Admin)
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "fullName email profileImage")
      .populate("vendor", "firstName lastName email status")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update complaint status (Admin)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({ success: true, message: `Complaint status updated to ${status}`, complaint });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get complaints by vendor (for Vendor profile or admin checks)
export const getVendorComplaints = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const complaints = await Complaint.find({ vendor: vendorId })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    console.error("Error fetching vendor complaints:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
