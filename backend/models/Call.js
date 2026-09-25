const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: { type: String, required: true, index: true },
  callerUsername: String,
  callerProfileImage: String,
  receiverId: { type: String, required: true, index: true },
  receiverUsername: String,
  receiverProfileImage: String,
  callType: { type: String, enum: ['audio', 'video'], default: 'audio' },
  status: { 
    type: String, 
    enum: ['completed', 'missed', 'rejected', 'cancelled'], 
    default: 'completed' 
  },
  duration: { type: Number, default: 0 }, // in seconds
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  timestamp: { type: Date, default: Date.now, index: true },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from creation
    index: true 
  }
});

// Compound Indexes for fast call logs retrieval and sorting without collection scans
callSchema.index({ callerId: 1, timestamp: -1 });
callSchema.index({ receiverId: 1, timestamp: -1 });

// TTL Index: Auto-delete call logs after 30 days
callSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Call', callSchema);
