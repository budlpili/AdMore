const mongoose = require('mongoose');

const privacySchema = new mongoose.Schema({
  title: {
    type: String,
    default: '개인정보처리방침'
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Privacy', privacySchema);




