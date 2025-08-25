const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    default: 'custom',
    enum: ['custom', 'system']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);



