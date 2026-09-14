const mongoose = require('mongoose');

const quickInquirySchema = new mongoose.Schema({
  email: { type: String, required: true },
  productName: { type: String, default: '' },
  productId: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, default: 'New' },
}, { timestamps: true });

module.exports = mongoose.model('QuickInquiry', quickInquirySchema);
