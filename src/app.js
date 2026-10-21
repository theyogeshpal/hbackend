const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
require('dotenv').config();

const app = express();

app.use(compression());

const path = require('path');

app.use(cors());
app.use(express.json());

// Add cache control for static files to improve load times
const staticOptions = { maxAge: '30d', immutable: true };
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
app.use('/api-v1/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
app.use('/api-v1/api/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users/auth', require('./routes/userAuthRoutes'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/subcategories', require('./routes/subcategories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/blog-categories', require('./routes/blogCategories'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/gallery-categories', require('./routes/galleryCategories'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/quotation-email', require('./routes/quotationRoutes'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/faq-categories', require('./routes/faqCategories'));
app.use('/api/certifications', require('./routes/certifications'));
app.use('/api/sliders', require('./routes/sliders'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/service-inquiries', require('./routes/serviceInquiries'));
app.use('/api/quick-inquiries', require('./routes/quickInquiries'));
app.use('/api/download-leads', require('./routes/downloadLeads'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/vendor-payouts', require('./routes/vendorPayouts'));
app.use('/api/vendor-management/report', require('./routes/vendorReport'));
app.use('/api/custom-products', require('./routes/customProducts'));
app.use('/api/wholesale-categories', require('./routes/wholesaleCategories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/artisans', require('./routes/artisans'));
app.use('/api/leaders', require('./routes/leaders'));
app.use('/api/product-cq', require('./routes/productCQ'));
app.use('/api/bulk-fmoq', require('./routes/bulkFmoq'));
app.use('/api/shipping-list', require('./routes/shippingList'));
app.use('/api/index-states', require('./routes/indexStates'));
app.use('/api/sub-admins', require('./routes/subAdmins'));
app.use('/api/submissions/reviews', require('./routes/reviews'));
app.use('/api/submissions/user-moments', require('./routes/userMoments'));
app.use('/api/submissions/feedback', require('./routes/feedback'));
app.use('/api/submissions/newsletter', require('./routes/newsletter'));
app.use('/api/retailer/inquiries', require('./routes/retailerInquiries'));
app.use('/api/retailer/orders', require('./routes/retailerOrders'));
app.use('/api/retailer/quotations', require('./routes/retailerQuotations'));
app.use('/api/retailer/invoices', require('./routes/retailerInvoices'));
app.use('/api/retailer/payments', require('./routes/retailerPayments'));
app.use('/api/retailer/shipping', require('./routes/retailerShipping'));
app.use('/api/blog-fdgw', require('./routes/blogFdgw'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/vendor-orders', require('./routes/vendorOrders'));
app.use('/api/domestic-logistics', require('./routes/domesticLogistics'));
app.use('/api/subscription-plans', require('./routes/subscriptionPlans'));
app.use('/api/subscription-enquiries', require('./routes/subscriptionEnquiries'));

// Seed Route
app.post('/api/trigger-seed', async (req, res) => {
  // Simple protection so not just anyone can wipe and seed the database
  const { secret } = req.body;
  if (secret !== process.env.SEED_SECRET && secret !== 'hieil_secret_seed') {
    return res.status(401).json({ message: 'Unauthorized. Invalid secret.' });
  }
  
  try {
    const { runSeeder } = require('../seed.js');
    await runSeeder();
    res.status(200).json({ message: 'Database seeded successfully via API!' });
  } catch (error) {
    console.error('API Seeding Error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

module.exports = app;
