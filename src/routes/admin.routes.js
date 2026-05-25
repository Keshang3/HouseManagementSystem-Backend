import express from "express"
import {
  adminLogin,
  pendingVendor,
  approveVendor,
  rejectVendor,
  getAllVendors
} from "../controllers/adminAuth.controllers.js";
import adminAuth from "../middlwares/adminAuth.middleware.js";
import { adminGetAllBookings, adminCancelBooking } from "../controllers/adminBooking.controller.js";

const router = express.Router();

router.post('/login', adminLogin);

router.use(adminAuth);

router.get('/pending', pendingVendor);
router.get('/vendors', getAllVendors);
router.patch('/approve/:id', approveVendor);
router.patch('/reject/:id', rejectVendor);

// Booking management
router.get('/bookings', adminGetAllBookings);
router.put('/bookings/:bookingId/cancel', adminCancelBooking);

export default router;