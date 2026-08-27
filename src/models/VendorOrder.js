const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  poNumber: String,
  agreedPriceInr: { type: Number, default: 0 },
  advancePaidInr: { type: Number, default: 0 },
  balancePaidInr: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Production Started', 'Completed', 'Goods Received'], default: 'Pending' },
  expectedDeliveryDate: Date,
  notes: { type: String, default: '' },
  installments: { type: Array, default: [] },
  incoterm: { type: String, default: 'FOB Jaipur, India' },
  currency: { type: String, default: 'INR' },
  paymentTerms: { type: String, default: 'As agreed per installments / advance schedules.' },
  paymentMethod: { type: String, default: 'Bank Transfer / UPI' },
  deliveryPort: { type: String, default: 'Jaipur / Delhi' },
  packaging: { type: String, default: 'Export-grade double-wall corrugated with custom foam inserts for fragile items.' },
  qualityAssurance: { type: String, default: '100% inspection before dispatch, photographic proof provided.' },
  leadTime: { type: String, default: 'As specified per product. Customizations may require additional time.' },
  cancellation: { type: String, default: 'Any cancellation or quantity change requests require notice.' },
  shippingMode: { type: String, default: 'Road Transport / Local Logistics' },
  preferredCarrier: { type: String, default: 'As agreed' },
  specialInstructions: { type: String, default: 'Ensure safe handling and proper packaging for transit.' }
}, { timestamps: true });

module.exports = mongoose.model('VendorOrder', schema);
