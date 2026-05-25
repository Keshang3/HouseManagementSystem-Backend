import express from "express";
import { initiatePayment, verifyPayment } from "../controllers/payment.controller.js";
import authMiddleware from "../middlwares/auth.middleware.js";

const paymentRouter = express.Router();

/**
 * Endpoint to initiate eSewa payment.
 * Requires authMiddleware to ensure only logged-in users can initiate payments.
 */
paymentRouter.post("/initiate", authMiddleware, initiatePayment);

/**
 * Optional: Endpoint to verify payment metadata after redirection.
 */
paymentRouter.get("/verify", verifyPayment);

export default paymentRouter;
