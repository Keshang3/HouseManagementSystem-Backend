import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Vendor from '../models/vendor.model.js';
import { generateConversationId } from '../utils/conversationId.js';
import { io } from '../socket.js';
import mongoose from 'mongoose';

// --- Helper Functions ---

/**
 * Validates messaging permissions between two users.
 */
const validateMessagingPermissions = async (sender, receiver) => {
    // 1. Block Check
    if (receiver.isBlockedUsers?.includes(sender._id)) {
        return { allowed: false, error: 'You are blocked by this user.' };
    }
    if (sender.isBlockedUsers?.includes(receiver._id)) {
        return { allowed: false, error: 'You have blocked this user.' };
    }

    // 2. Role-based restrictions (Admins can message anyone)
    if (sender.role === 'Admin') return { allowed: true };

    // In a marketplace, Users and Vendors can message each other.
    // If they are the same role (e.g., User to User), we might want to restrict it or allow it.
    // For now, let's allow all validated communications unless blocked.
    
    return { allowed: true };
};

// --- Controllers ---

/**
 * @desc Send a direct message
 * @route POST /api/messages/send
 */
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text, images, replyToId } = req.body;
        const senderId = req.user.id;
        const senderRole = req.user.role;

        if (!receiverId || (!text && (!images || images.length === 0))) {
            return res.status(400).json({ message: 'ReceiverId and content are required.' });
        }

        // Identify receiver and their role
        let receiver = await User.findById(receiverId);
        let receiverRole = 'User';

        if (!receiver) {
            receiver = await Vendor.findById(receiverId);
            receiverRole = 'Vendor';
        }

        if (!receiver) {
            // Check if it's an admin?
            if (receiverId === 'super_admin') {
                receiver = { _id: 'super_admin', fullName: 'System Admin' };
                receiverRole = 'Admin';
            } else {
                return res.status(404).json({ message: 'Receiver not found.' });
            }
        }

        // Permission Validation
        const permission = await validateMessagingPermissions(req.user.account || { _id: senderId, role: senderRole }, receiver);
        if (!permission.allowed) {
            return res.status(403).json({ message: permission.error });
        }

        const conversationId = generateConversationId(senderId, receiverId);

        const newMessage = new Message({
            senderId,
            receiverId,
            senderModel: senderRole,
            receiverModel: receiverRole,
            conversationId,
            text,
            images,
            replyToId
        });

        await newMessage.save();

        // Socket logic for real-time notifications
        if (io) {
            io.to(receiverId.toString()).emit('new_message', {
                ...newMessage.toObject(),
                id: newMessage._id,
                timestamp: newMessage.createdAt
            });
        }
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Server error sending message.' });
    }
};

/**
 * @desc Get all messages in a conversation
 * @route GET /api/messages/:receiverId
 */
export const getConversation = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user.id;
        const conversationId = generateConversationId(senderId, receiverId);

        const messages = await Message.find({ 
            conversationId, 
            isDeleted: false 
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching conversation.' });
    }
};

/**
 * @desc Get list of all conversations for current user
 * @route GET /api/messages/conversations
 */
export const getConversationsList = async (req, res) => {
    try {
        const userIdString = req.user.id;
        const userId = new mongoose.Types.ObjectId(userIdString);

        // Use aggregation to find the last message for each conversation
        const conversations = await Message.aggregate([
            { $match: { 
                $or: [{ senderId: userId }, { receiverId: userId }],
                isDeleted: false
            } },
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$conversationId',
                lastMessage: { $first: '$$ROOT' },
                unreadCount: { 
                    $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$read', false] } ] }, 1, 0] } 
                }
            } },
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);

        // Populate user/vendor details for each conversation
        const populatedConversations = await Promise.all(conversations.map(async (conv) => {
            const otherUserId = conv.lastMessage.senderId.toString() === userId.toString() 
                ? conv.lastMessage.receiverId 
                : conv.lastMessage.senderId;
            
            const otherUserRole = conv.lastMessage.senderId.toString() === userId.toString()
                ? conv.lastMessage.receiverModel
                : conv.lastMessage.senderModel;

            let otherUser;
            if (otherUserRole === 'User') {
                otherUser = await User.findById(otherUserId).select('fullName email userName profileImage');
            } else if (otherUserRole === 'Vendor') {
                otherUser = await Vendor.findById(otherUserId).select('firstName lastName email profileImage');
            } else {
                otherUser = { _id: 'super_admin', fullName: 'System Admin', role: 'Admin' };
            }

            let name = 'Unknown User';
            let profilePhoto = null;

            if (otherUser) {
                if (otherUserRole === 'User') {
                    name = otherUser.fullName;
                    profilePhoto = otherUser.profileImage?.url;
                } else if (otherUserRole === 'Vendor') {
                    name = `${otherUser.firstName} ${otherUser.lastName}`;
                    profilePhoto = otherUser.profileImage?.url; // Assuming Vendor might have profileImage too or similar
                } else {
                    name = otherUser.fullName;
                }
            }

            return {
                ...conv,
                otherUser: {
                    _id: otherUserId,
                    role: otherUserRole,
                    name: name,
                    profilePhoto: profilePhoto
                }
            };
        }));

        res.json(populatedConversations);
    } catch (error) {
        console.error('Error in getConversationsList:', error);
        res.status(500).json({ message: 'Server error fetching conversations.' });
    }
};

/**
 * @desc Get contacts for starting new conversations
 * @route GET /api/messages/contacts
 */
export const getContacts = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        let users = [];
        let vendors = [];

        const searchQuery = query ? {
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { userName: { $regex: query, $options: 'i' } },
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        } : {};

        if (currentUserRole === 'Vendor') {
            // Vendors look for Users
            users = await User.find(searchQuery).limit(20).select('fullName userName profileImage email');
        } else if (currentUserRole === 'User') {
            // Users look for Vendors
            vendors = await Vendor.find(searchQuery).limit(20).select('firstName lastName profileImage email');
        } else {
            // Admins look for everyone
            users = await User.find(searchQuery).limit(10).select('fullName userName profileImage email');
            vendors = await Vendor.find(searchQuery).limit(10).select('firstName lastName profileImage email');
        }

        const formattedContacts = [
            ...users.map(u => ({ _id: u._id, name: u.fullName, role: 'User', profilePhoto: u.profileImage?.url, email: u.email })),
            ...vendors.map(v => ({ _id: v._id, name: `${v.firstName} ${v.lastName}`, role: 'Vendor', profilePhoto: v.profileImage?.url, email: v.email }))
        ].filter(c => c._id.toString() !== currentUserId.toString());

        res.json(formattedContacts);
    } catch (error) {
        console.error('Error in getContacts:', error);
        res.status(500).json({ message: 'Server error fetching contacts.' });
    }
};

/**
 * @desc Mark a conversation as read
 * @route PUT /api/messages/read/:conversationId
 */
export const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        console.log(`[markAsRead] Executing for conversation: ${conversationId}, user: ${userId}`);

        const result = await Message.updateMany(
            { conversationId, receiverId: userId.toString() },
            { $set: { read: true } }
        );
        
        console.log(`[markAsRead] Update result:`, result);

        res.json({ message: 'Conversation marked as read.', result });
    } catch (error) {
        console.error(`[markAsRead] Error:`, error);
        res.status(500).json({ message: 'Server error marking read.' });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ message: 'No message IDs provided' });
        }

        const result = await Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { read: true } }
        );

        console.log(`[markMessagesAsRead] Marked ${result.modifiedCount} messages as read`);

        res.json({ message: 'Messages marked as read.', result });
    } catch (error) {
        console.error(`[markMessagesAsRead] Error:`, error);
        res.status(500).json({ message: 'Server error marking messages read.' });
    }
};

/**
 * @desc Delete a message
 * @route DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found.' });

        // Only sender can delete their own message for everyone
        if (message.senderId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        message.isDeleted = true;
        await message.save();

        res.json({ message: 'Message deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting message.' });
    }
};

/**
 * @desc Block a user
 * @route POST /api/messages/block/:userId
 */
export const blockUser = async (req, res) => {
    try {
        const targetId = req.params.userId;
        const myAccount = req.user.account;

        if (!myAccount.isBlockedUsers.includes(targetId)) {
            myAccount.isBlockedUsers.push(targetId);
            await myAccount.save();
        }

        res.json({ message: 'User blocked.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error blocking user.' });
    }
};

/**
 * @desc Unblock a user
 * @route POST /api/messages/unblock/:userId
 */
export const unblockUser = async (req, res) => {
    try {
        const targetId = req.params.userId;
        const myAccount = req.user.account;

        myAccount.isBlockedUsers = myAccount.isBlockedUsers.filter(id => id.toString() !== targetId.toString());
        await myAccount.save();

        res.json({ message: 'User unblocked.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error unblocking user.' });
    }
};
