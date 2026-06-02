import dotenv from "dotenv"
dotenv.config()
import express from "express"
const app = express();
import connectDB from './config/db.js';
import cors from 'cors'
import authRouter from "./routes/auth.routes.js";
import cookieParser from 'cookie-parser';
import vendorRoutes from "./routes/vendor.routes.js"
import adminRoutes from "./routes/admin.routes.js";
import careerRoutes from "./routes/career.routes.js";

import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";
import gamificationRouter from "./routes/gamification.routes.js";
import messageRoutes from "./routes/message.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";

import http from "http";
import { setupSocket } from "./socket.js";

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser())
app.use(cors(
  {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    credentials: true
  }
));
app.use("/api/user", authRouter);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", careerRoutes);

app.use("/api/payment", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api/messages", messageRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/complaints", complaintRoutes);

setupSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on ${PORT} `);
  });
}).catch((err) => {
  console.error("Failed to connect to DB", err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global crash error:", err);
  res.status(500).json({
    message: "Internal Server Error (Global Handler)",
    error: err.message,
    stack: process.env.NODE_ENVIRONMENT === 'development' ? err.stack : undefined
  });
});
































/*
import express from 'express'
const app =express();

( async () => {
  try{
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", (error)=>{
      console.log(error);
      throw error
      
    })

    app.listen(process.env.PORT, ()=>{
      console.log(`App is listening on port ${process.env.PORT}`);
      
    })

  }catch(error){
    console.error
  }

})()
  */