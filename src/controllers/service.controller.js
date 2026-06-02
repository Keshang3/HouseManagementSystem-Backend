import Service from "../models/service.model.js";
import Booking from "../models/booking.model.js";
import Review from "../models/review.model.js";

// @desc    Get all active services (Public)
// @route   GET /api/services
export const getServices = async (req, res) => {
  try {
    const { q, category, rating, availability, sort } = req.query;

    const query = { isActive: true };
    if (q) {
      query.name = { $regex: q, $options: "i" };
    }
    
    if (category) {
      const categories = category.split(",");
      query.category = { $in: categories };
    }

    const services = await Service.find(query);

    // Get all completed bookings' service counts
    const bookingCounts = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$service", count: { $sum: 1 } } }
    ]);

    // Get average rating and review counts per service
    const reviewStats = await Review.aggregate([
      { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
      { $unwind: "$booking" },
      {
        $group: {
          _id: "$booking.service",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const bookingMap = new Map(bookingCounts.map(b => [b._id, b.count]));
    const reviewMap = new Map(reviewStats.map(r => [r._id, r]));

    let servicesWithStats = services.map(service => {
      const bookedCount = bookingMap.get(service.name) || 0;
      const rStat = reviewMap.get(service.name) || { averageRating: 0, totalReviews: 0 };
      
      return {
        ...service.toObject(),
        rating: rStat.averageRating > 0 ? parseFloat(rStat.averageRating.toFixed(1)) : 0,
        totalReviews: rStat.totalReviews,
        bookedCount: bookedCount,
        availability: "Available Now", // Services are generally available
      };
    });

    // Apply Rating Filter
    if (rating) {
      if (rating === "4★ & above") {
        servicesWithStats = servicesWithStats.filter(s => s.rating >= 4.0);
      } else if (rating === "3★ & above") {
        servicesWithStats = servicesWithStats.filter(s => s.rating >= 3.0);
      } else if (rating === "Highest Rated") {
        servicesWithStats = servicesWithStats.filter(s => s.rating >= 4.8);
      }
    }

    // Apply Availability Filter
    if (availability) {
      servicesWithStats = servicesWithStats.filter(s => s.availability === availability);
    }

    // Apply Sorting
    if (sort) {
      servicesWithStats.sort((a, b) => {
        switch (sort) {
          case "Highest Rated": return b.rating - a.rating;
          case "Most Booked": return b.bookedCount - a.bookedCount;
          case "Newest Services": return new Date(b.createdAt) - new Date(a.createdAt);
          case "A–Z": return a.name.localeCompare(b.name);
          case "Most Popular":
          default:
            return (b.rating * b.bookedCount) - (a.rating * a.bookedCount);
        }
      });
    } else {
      // Default Sort (Most Popular)
      servicesWithStats.sort((a, b) => (b.rating * b.bookedCount) - (a.rating * a.bookedCount));
    }

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      services: servicesWithStats,
    });
  } catch (error) {
    console.error("Error in getServices:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all services (Admin only)
// @route   GET /api/services/all
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      services: services || [],
    });
  } catch (error) {
    console.error("Error in getAllServices:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Add new service (Admin only)
// @route   POST /api/services
export const createService = async (req, res) => {
  try {
    const { name, description, icon, category, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    // Check for existing service (case-insensitive)
    const existingService = await Service.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Service already exists. Please use a different service name.",
      });
    }

    const serviceData = {
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true,
    };

    if (description) serviceData.description = description;
    if (icon) serviceData.icon = icon;
    if (category) serviceData.category = category;

    const service = await Service.create(serviceData);

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Error in createService:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update service (Admin only)
// @route   PUT /api/services/:id
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check for duplicate name (case-insensitive) if name is being updated
    if (updateData.name) {
      const existingService = await Service.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, "i") }
      });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: "Service already exists. Please use a different service name.",
        });
      }
      updateData.name = updateData.name.trim();
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error in updateService:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete service (Admin only)
// @route   DELETE /api/services/:id
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    await Service.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteService:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};