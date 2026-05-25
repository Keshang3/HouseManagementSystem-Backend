import VendorAvailability from "../models/vendorAvailability.model.js";
import Vendor from "../models/vendor.model.js"

// Unified logic for setting availability
const saveAvailabilityLogic = async (vendorId, body) => {
  const { dailyConfig = [], blockedDates = [] } = body;

  const workingDays = dailyConfig
    .filter(day => day.isWorking)
    .map(day => day.day);

  const allSelectedSlots = dailyConfig
    .filter(day => day.isWorking)
    .flatMap(day => day.selectedSlots || []);

  const uniqueSlots = [...new Set(allSelectedSlots)].sort();

  const timeSlots = uniqueSlots.map(start => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = (startHour + 1).toString().padStart(2, '0');
    return {
      startTime: start,
      endTime: `${endHour}:00`
    };
  });

  let availability = await VendorAvailability.findOne({ vendorId });

  if (availability) {
    availability.dailyConfig = dailyConfig;
    availability.blockedDates = blockedDates;
    availability.workingDays = workingDays;
    availability.timeSlots = timeSlots;
    await availability.save();
  } else {
    availability = await VendorAvailability.create({
      vendorId,
      dailyConfig,
      blockedDates,
      workingDays,
      timeSlots,
    });
  }
  return availability;
};

export const setAvailability = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (vendor.status !== "approved") {
      return res.status(403).json({ message: "Vendor not approved" });
    }

    const availability = await saveAvailabilityLogic(vendorId, req.body);
    return res.status(200).json({ message: "Availability updated successfully", availability });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const setAvailabilitySignup = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    // Allow pending vendors to set availability during signup
    const availability = await saveAvailabilityLogic(vendorId, req.body);
    
    // Update vendor step to 5
    vendor.currentStep = 5;
    await vendor.save();

    return res.status(200).json({ message: "Availability saved! Almost there.", availability });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const availability = await VendorAvailability.findOne({ vendorId });
    res.status(200).json({ availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Booking from "../models/booking.model.js";

export const getVendorAvailableSlots = async (req, res) => {
  try {
    const { vendorId, date } = req.params;

    // 1. Get vendor's availability configuration
    const availability = await VendorAvailability.findOne({ vendorId });
    if (!availability) {
      return res.status(200).json({ slots: [] });
    }

    // 2. Check if the specific date is blocked
    if (availability.blockedDates?.includes(date)) {
      return res.status(200).json({ slots: [] });
    }

    // 3. Determine day of week to get day-specific config
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    const dayConfig = availability.dailyConfig?.find(d => d.day === dayName);

    if (!dayConfig || !dayConfig.isWorking) {
      return res.status(200).json({ slots: [] });
    }

    // 4. Prepare potential slots from configuration
    const potentialSlots = (dayConfig.selectedSlots || []).map(start => {
      const startHour = parseInt(start.split(':')[0]);
      const endHour = (startHour + 1).toString().padStart(2, '0');
      return {
        startTime: start,
        endTime: `${endHour}:00`
      };
    });

    // 5. Fetch existing bookings for this vendor on this date
    // We only care about bookings that aren't cancelled
    const existingBookings = await Booking.find({
      vendorId,
      date,
      status: { $ne: "cancelled" }
    });

    const bookedSlots = existingBookings.map(b => b.time);

    // 6. Filter slots: mark as booked if already taken OR if it's today and time has passed
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    const finalSlots = potentialSlots.map(slot => {
      const isBooked = bookedSlots.includes(slot.startTime);
      let isPast = false;

      if (date === todayStr) {
        const slotHour = parseInt(slot.startTime.split(':')[0]);
        // Slot is past if its start hour is less than or equal to current hour
        if (slotHour <= currentHour) {
          isPast = true;
        }
      }

      return {
        ...slot,
        booked: isBooked || isPast
      };
    });

    return res.status(200).json({ slots: finalSlots });
  } catch (error) {
    console.error("Error in getVendorAvailableSlots:", error);
    return res.status(500).json({ message: error.message });
  }
};
