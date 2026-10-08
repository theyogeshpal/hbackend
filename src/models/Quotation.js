const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  quoteNo: String,
  customer: String,
  customerEmail: String,
  mobile: String,
  country: String,
  product: String,
  qty: String,
  rate: String,
  gstPercent: String,
  subtotal: String,
  gstAmount: String,
  total: String,
  budget: String,
  validTill: String,
  address: { type: String, default: '' },
  inquiryId: String,
  incoterm: { type: String, default: '' },
  paymentTerms: { type: String, default: '' },
  deliveryPort: { type: String, default: '' },
  status: { type: String, default: 'Sent' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['inquiry', 'retailer'], default: 'inquiry' }
}, { timestamps: true });
module.exports = mongoose.model('Quotation', schema);
