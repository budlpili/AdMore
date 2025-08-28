const mongoose = require('mongoose');

const exportedFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  userEmail: {
    type: String,
    default: null // null이면 전체 메시지, 값이 있으면 특정 유저 메시지
  },
  messageCount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExportedFile', exportedFileSchema);
