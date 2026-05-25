import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import connectDB from "./src/config/db.js";
import { updateUserPoints } from "./src/services/gamification.service.js";

dotenv.config();

async function test() {
  await connectDB();
  
  const user = await User.findOne({});
  if (!user) {
    console.log("No user found");
    process.exit(0);
  }

  try {
    const res = await updateUserPoints(user._id, "booking");
    console.log("Success:", !!res);
  } catch (err) {
    console.log("Error:", err.message);
  }
  process.exit(0);
}

test();
