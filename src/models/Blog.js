const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  category: String,
  title: { type: String, required: true },
  tag: String,
  description: String,
  image: String,
  content: String,
  author: { type: String, default: 'HIEIL' },
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });
module.exports = mongoose.model('Blog', schema);
