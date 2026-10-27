const mongoose = require('mongoose');

const subscriptionEnquirySchema = new mongoose.Schema({
  planName: { type: String, default: '' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
  duration: { type: String, default: '' },
  price: { type: String, default: '' },
  name: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  productCategories: { type: String, default: '' },
  targetMarket: { type: String, default: '' },
  expectedOrderSize: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, enum: ['quick', 'detailed'], default: 'quick' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['Pending', 'Contacted', 'Active', 'Rejected', 'Expired'], 
    default: 'Pending' 
  },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionEnquiry', subscriptionEnquirySchema);
