import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "./src/models/user.model.js";

async function run() {
  await mongoose.connect(`${process.env.MONGODB_URI}/HouseManangementSystem`);
  
  const user = await User.findOne();
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }

  const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
  );

  console.log("Generated token for user:", user.email);

  try {
    const quizRes = await axios.get("http://localhost:8000/api/gamification/quiz", {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Quiz Response:", quizRes.data);
  } catch (err) {
    console.log("API Error:", err.response ? err.response.data : err.message, err.response?.status);
  }
  process.exit(0);
}

run();
