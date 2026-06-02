import express from 'express'
import { vendorSignup, vendorLogIn, uploadKycData, completeVendorProfile, refillVendorSignup, refillKyc, uploadAllDocuments, extradata, getVendorStatus, getVendorProfile, increaseRevenue, getAverageRating, vendorForgotPassword, vendorResetPassword, vendorGoogleAuth, getLeaderboard } from '../controllers/vendorAuth.controller.js';
import { upload } from '../config/multer.js';
import { vendorAuth } from '../middlwares/vendorAuth.middleware.js';
import { setAvailability, getAvailability, setAvailabilitySignup } from '../controllers/vendorAvailability.controllers.js';
import { getVendorsBySkill } from "../controllers/vendorAuth.controller.js";





import { upload as memoryUpload } from '../middlwares/multer.js';
import { updateVendorProfileImage, updateVendorProfileInfo } from '../controllers/vendorAuth.controller.js';

const vendorRoutes = express.Router();

vendorRoutes.get("/leaderboard", getLeaderboard);
vendorRoutes.get("/profile", vendorAuth, getVendorProfile);
vendorRoutes.put("/profile/image", vendorAuth, memoryUpload.single("profileImage"), updateVendorProfileImage);
vendorRoutes.put("/profile/info", vendorAuth, updateVendorProfileInfo);
vendorRoutes.post('/signup', vendorSignup);
vendorRoutes.post('/login', vendorLogIn);
vendorRoutes.post('/forgotpassword', vendorForgotPassword);
vendorRoutes.post('/resetpassword/:token', vendorResetPassword);
vendorRoutes.post('/google-auth', vendorGoogleAuth);
vendorRoutes.put('/kyc/:id', uploadKycData);
// vendorRoutes.post('/:id/front-photo', upload.single("citizenshipFrontPhoto"), uploadFrontPhoto);
// vendorRoutes.post('/:id/back-photo', upload.single("citizenshipBackPhoto"), uploadBackPhoto);
// vendorRoutes.post('/:id/certificate',upload.single("certificate"), uploadCertificates);
// vendorRoutes.post("/:id/complete-profile", completeVendorProfile );
vendorRoutes.put("/documents/:id", upload.fields([{ name: "citizenshipFrontPhoto", maxCount: 1 },
{ name: "citizenshipBackPhoto", maxCount: 1 },
{ name: "certificates", maxCount: 10 },
]), uploadAllDocuments);
// vendorRoutes.put("/:id/complete-profile", completeVendorProfile)
vendorRoutes.get("/refillKyc/:id", refillKyc);
vendorRoutes.get("/extradata/:id", extradata);
vendorRoutes.get("/status/:vendorId", getVendorStatus);

import { getVendorBookings, getAvailableBookings, acceptBooking, vendorMarkAsCompleted, rejectBooking, startService } from '../controllers/booking.controller.js';

vendorRoutes.post("/setavailability", vendorAuth, setAvailability);
vendorRoutes.post("/signup/availability/:vendorId", setAvailabilitySignup);
vendorRoutes.get("/getavailability", vendorAuth, getAvailability);

vendorRoutes.get("/available-bookings", vendorAuth, getAvailableBookings);
vendorRoutes.put("/bookings/:bookingId/accept", vendorAuth, acceptBooking);
vendorRoutes.put("/bookings/:bookingId/start", vendorAuth, startService);
vendorRoutes.put("/bookings/:bookingId/complete", vendorAuth, vendorMarkAsCompleted);
vendorRoutes.put("/bookings/:bookingId/reject", vendorAuth, rejectBooking);

vendorRoutes.get("/bookings", vendorAuth, getVendorBookings);

vendorRoutes.put("/:id/complete-profile", completeVendorProfile);

vendorRoutes.get("/by-service/:service", getVendorsBySkill);
vendorRoutes.patch("/:id/revenue", increaseRevenue);
vendorRoutes.get("/:id/average-rating", getAverageRating);

vendorRoutes.get("/:id", refillVendorSignup);



export default vendorRoutes;