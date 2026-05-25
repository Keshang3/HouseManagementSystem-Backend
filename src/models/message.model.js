import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        refPath: 'senderModel'
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        refPath: 'receiverModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Vendor', 'Admin']
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['User', 'Vendor', 'Admin']
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        trim: true
    },
    images: [{
        type: String // Base64 or URL
    }],
    replyToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for efficiently fetching conversations ordered by time
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
