const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String, required: true }, // e.g. "3 months", "6 months", "12 months"
  price: { type: String, required: true }, // e.g. "$1,499"
  originalPrice: { type: String }, // e.g. "$1,799" (for discount/strikethrough)
  offerBadge: { type: String }, // e.g. "Save $300" or "Launch Offer"
  targetAudience: { type: String }, // e.g. "For new importers, independent retailers..."
  features: { type: [String], default: [] }, // Array of feature bullet points
  extraHeader: { type: String }, // e.g. "Everything in Essential, plus"
  promise: { type: String }, // e.g. "Start sourcing without building a supplier network from scratch."
  isPopular: { type: Boolean, default: false },
  popularTag: { type: String, default: 'Most Popular' },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
