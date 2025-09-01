const mongoose = require('mongoose');

const termsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: '이용약관'
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

module.exports = mongoose.model('Terms', termsSchema);






