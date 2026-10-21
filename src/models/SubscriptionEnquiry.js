const mongoose = require('mongoose');

const subscriptionEnquirySchema = new mongoose.Schema({
  planName: { type: String, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  duration: { type: String },
  price: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  companyName: { type: String },
  productCategories: { type: String },
  targetMarket: { type: String },
  expectedOrderSize: { type: String },
  message: { type: String },
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
