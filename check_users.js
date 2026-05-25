import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./src/models/user.model.js";

async function run() {
  await mongoose.connect(`${process.env.MONGODB_URI}/HouseManangementSystem`);
  
  const users = await User.find().limit(5).lean();
  console.log("Users in DB:");
  users.forEach(u => {
      console.log(`- ID: ${u._id}`);
      console.log(`  firstName: ${u.firstName}`);
      console.log(`  lastName: ${u.lastName}`);
      console.log(`  fullName: ${u.fullName}`);
      console.log(`  userName: ${u.userName}`);
      console.log(`  name: ${u.name}`);
  });
  process.exit(0);
}

run();
