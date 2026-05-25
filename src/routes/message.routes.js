import express from 'express';
import { unifiedAuth } from '../middlwares/unifiedAuth.middleware.js';
import * as messageController from '../controllers/message.controller.js';

const router = express.Router();

// All message routes are protected by unifiedAuth
router.use(unifiedAuth);

// Send message
router.post('/send', messageController.sendMessage);

// Get list of conversations (latest messages)
router.get('/conversations', messageController.getConversationsList);

// Get contacts for starting new conversations
router.get('/contacts', messageController.getContacts);

// Get messages for a specific conversation
router.get('/:receiverId', messageController.getConversation);

// Mark explicit messages as read
router.put('/read-messages', messageController.markMessagesAsRead);

// Mark as read (legacy by conversation)
router.put('/read/:conversationId', messageController.markAsRead);

// Delete message
router.delete('/:id', messageController.deleteMessage);

// Blocking
router.post('/block/:userId', messageController.blockUser);
router.post('/unblock/:userId', messageController.unblockUser);

export default router;
