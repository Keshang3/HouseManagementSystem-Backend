import { Router } from "express";
import { unifiedAuth } from "../middlwares/unifiedAuth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

// Apply unified auth middleware to all notification routes
router.use(unifiedAuth);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
