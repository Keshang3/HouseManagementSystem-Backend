import Booking from "../models/booking.model.js";
import Vendor from "../models/vendor.model.js";
import User from "../models/user.model.js";

// GET: All bookings for admin
export const adminGetAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("vendorId", "name email phone service")
            .populate("userId", "firstName lastName email phoneNo")
            .sort({ createdAt: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT: Admin cancel any booking
export const adminCancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        booking.status = "cancelled";
        await booking.save();

        res.status(200).json({
            message: "Booking cancelled by admin",
            booking,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
