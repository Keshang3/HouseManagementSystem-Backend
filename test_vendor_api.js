import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import Vendor from "./src/models/vendor.model.js";
import axios from "axios";

import connectDB from "./src/config/db.js";

dotenv.config();

async function test() {
  await connectDB();
  
  const vendor = await Vendor.findOne({});
  if (!vendor) {
    console.log("No vendor found");
    process.exit(0);
  }

  const token = jwt.sign({ id: vendor._id, role: "vendor" }, process.env.JWT_SECRET || "fallback", { expiresIn: "1d" });
  console.log("Generated token:", token);

  try {
    const resProfile = await axios.get("http://localhost:8000/api/vendor/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile response:", resProfile.status);
  } catch (err) {
    console.log("Profile error:", err.response?.status, err.response?.data);
  }

  try {
    const resBookings = await axios.get("http://localhost:8000/api/vendor/bookings", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Bookings response:", resBookings.status);
  } catch (err) {
    console.log("Bookings error:", err.response?.status, err.response?.data);
  }

  try {
    const resReviews = await axios.get(`http://localhost:8000/api/reviews/vendor/${vendor._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Reviews response:", resReviews.status);
  } catch (err) {
    console.log("Reviews error:", err.response?.status, err.response?.data);
  }

  process.exit(0);
}

test();
