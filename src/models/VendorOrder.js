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
  installments: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('VendorOrder', schema);
