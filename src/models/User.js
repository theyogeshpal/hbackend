const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  phone: { type: String },
  role: { type: String, default: 'user' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  companyName: { type: String }, // For B2B/Wholesale users
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
