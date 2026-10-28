const mongoose = require('mongoose');

const catalogueItemSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  title: { type: String, required: true },
  file: { type: String, required: true },
  badge: { type: String, default: '' }
}, { _id: false });

const catalogueRequestSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  message: { type: String, default: '' },
  catalogues: [catalogueItemSchema],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminNotes: { type: String, default: '' },
  approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('CatalogueRequest', catalogueRequestSchema);
