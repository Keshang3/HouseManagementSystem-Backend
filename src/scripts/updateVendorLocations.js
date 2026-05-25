import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "../models/vendor.model.js";

dotenv.config();

const updateVendors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const vendors = await Vendor.find({ status: "approved" });
    console.log(`Found ${vendors.length} approved vendors`);

    for (const vendor of vendors) {
      // Assign random locations around Kathmandu [85.3, 27.7]
      const lng = 85.3 + (Math.random() - 0.5) * 0.1;
      const lat = 27.7 + (Math.random() - 0.5) * 0.1;

      vendor.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
      await vendor.save();
      console.log(`Updated location for ${vendor.firstName} ${vendor.lastName}`);
    }

    console.log("All existing vendors updated with sample locations");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

updateVendors();
