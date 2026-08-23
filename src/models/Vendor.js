const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  amount: String,
  commission: String,
  email: String,
  phone: String,
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });
module.exports = mongoose.model('Vendor', schema);
