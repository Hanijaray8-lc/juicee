const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['system', 'user', 'admin'],
    default: 'user'
  },
  senderName: {
    type: String,
    default: 'User'
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const HelpQuerySchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'App Bug / Technical Issue'
  },
  issueDescription: {
    type: String,
    required: true,
    trim: true
  },
  screenshots: [
    {
      name: String,
      dataUrl: String
    }
  ],
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Resolved'],
    default: 'Pending'
  },
  priority: {
    type: String,
    default: 'Normal'
  },
  replies: [ReplySchema]
}, {
  timestamps: true
});

HelpQuerySchema.index({ createdAt: -1 });
HelpQuerySchema.index({ mobileNumber: 1 });
HelpQuerySchema.index({ status: 1 });

module.exports = mongoose.model('HelpQuery', HelpQuerySchema);
