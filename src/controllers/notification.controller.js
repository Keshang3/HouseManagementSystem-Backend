import Notification from "../models/Notification.model.js";
import { io } from "../socket.js";

// Helper function to create and emit notification
export const createAndEmitNotification = async (userId, userModel, message, type = "INFO", link = "") => {
  try {
    const notification = await Notification.create({
      userId,
      userModel,
      message,
      type,
      link,
    });

    // Emit via WebSocket to the specific user's room
    if (io) {
      io.to(userId.toString()).emit("new_notification", notification);
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw, so we don't break the main flow if notification fails
  }
};

// Controller: Get notifications for logged in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // from unifiedAuth middleware
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// Controller: Mark specific notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// Controller: Mark all as read for logged in user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

// Controller: Delete specific notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};
