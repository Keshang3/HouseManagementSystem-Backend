import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";
import Vendor from "./models/vendor.model.js";

let io;
const onlineUsers = new Map(); // userId -> Set of socketIds (to handle multiple tabs)

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000"],
      credentials: true,
    },
  });

  // Authentication Middleware for Socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let account;
      let role;

      if (decoded.id === "super_admin") {
        account = { _id: "super_admin" };
        role = "Admin";
      } else {
        // Try to find user or vendor
        account = await User.findById(decoded.id);
        role = "User";
        
        if (!account) {
          account = await Vendor.findById(decoded.id);
          role = "Vendor";
        }
      }

      if (!account) return next(new Error("User not found"));

      socket.user = { id: account._id, role };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.user.id} (${socket.user.role})`);

    // Add to online users
    const userIdStr = socket.user.id.toString();
    if (!onlineUsers.has(userIdStr)) {
      onlineUsers.set(userIdStr, new Set());
    }
    onlineUsers.get(userIdStr).add(socket.id);

    // Broadcast user is online
    io.emit("user_status_change", { userId: userIdStr, status: "online" });

    // Join a room specifically for this user/vendor
    socket.join(socket.user.id.toString());

    // Join a booking chat room
    socket.on("join_booking_chat", (bookingId) => {
        socket.join(`booking_${bookingId}`);
        console.log(`User ${socket.user.id} joined booking room: booking_${bookingId}`);
    });



    socket.on("check_online_status", (userId, callback) => {
      const isOnline = onlineUsers.has(userId.toString());
      if (typeof callback === "function") {
          callback({ isOnline });
      }
    });

    // --- Real-time Messaging Events ---

    socket.on("send_message", (messageData) => {
      const { receiverId, bookingId } = messageData;
      // Emit to the receiver's room
      io.to(receiverId.toString()).emit("new_message", messageData);
      
      // If it's a booking message, also emit to the booking room
      if (bookingId) {
          io.to(`booking_${bookingId}`).emit("new_message", messageData);
      }
    });

    socket.on("message_read", (data) => {
        const { conversationId, senderId } = data;
        // Notify the original sender that their message was read
        io.to(senderId.toString()).emit("message_marked_read", { conversationId });
    });

    socket.on("typing", (data) => {
        const { receiverId, bookingId } = data;
        if (bookingId) {
            io.to(`booking_${bookingId}`).emit("user_typing", { 
                bookingId, 
                senderId: socket.user.id 
            });
        } else if (receiverId) {
            io.to(receiverId.toString()).emit("user_typing", { 
                userId: socket.user.id, 
                isTyping: true 
            });
        }
    });

    socket.on("stop_typing", (data) => {
        const { receiverId, bookingId } = data;
        if (bookingId) {
            io.to(`booking_${bookingId}`).emit("user_stop_typing", { 
                bookingId, 
                senderId: socket.user.id 
            });
        } else if (receiverId) {
            io.to(receiverId.toString()).emit("user_stop_typing", { 
                userId: socket.user.id
            });
        }
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.user.id}`);
      const userIdStr = socket.user.id.toString();
      
      const userSockets = onlineUsers.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userIdStr);
          // Broadcast user is offline
          io.emit("user_status_change", { userId: userIdStr, status: "offline" });
        }
      }
    });
  });

  return io;
};

export { setupSocket, io };
