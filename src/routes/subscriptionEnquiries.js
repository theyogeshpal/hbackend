const express = require('express');
const router = express.Router();
const SubscriptionEnquiry = require('../models/SubscriptionEnquiry');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEnquiryEmail } = require('../utils/mailer');

// GET all enquiries (for Admin)
router.get('/', async (req, res) => {
  try {
    const list = await SubscriptionEnquiry.find()
      .populate('userId', 'name email phone')
      .populate('planId', 'name price duration')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single enquiry
router.get('/:id', async (req, res) => {
  try {
    const doc = await SubscriptionEnquiry.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('planId', 'name price duration')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE enquiry (from frontend website)
router.post('/', async (req, res) => {
  try {
    const doc = await SubscriptionEnquiry.create(req.body);

    // Auto-create user account if email provided or link to existing
    if (req.body.email) {
      try {
        let existingUser = await User.findOne({ email: req.body.email });
        if (!existingUser) {
          existingUser = await User.create({
            email: req.body.email,
            name: req.body.name || 'User',
            phone: req.body.phone || '',
            companyName: req.body.companyName || ''
          });
        }
        doc.userId = existingUser._id;
        await doc.save();
      } catch (userErr) {
        console.error('Failed to link user to subscription enquiry:', userErr);
      }
    }

    // Create Notification for admin
    try {
      await Notification.create({
        modelName: 'SubscriptionEnquiry',
        title: 'New Membership Enquiry',
        message: `${req.body.name || 'A customer'} enquired about ${req.body.planName || 'Membership'}.`,
        link: '/admin/membership-enquiries'
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Send email notification to admin
    try {
      sendEnquiryEmail({
        customer: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        product: `Membership: ${req.body.planName || 'Plan'} (${req.body.duration || ''} - ${req.body.price || ''})`,
        message: `Company: ${req.body.companyName || 'N/A'}\nCategories: ${req.body.productCategories || 'N/A'}\nTarget Market: ${req.body.targetMarket || 'N/A'}\nExpected Order Size: ${req.body.expectedOrderSize || 'N/A'}\nMessage: ${req.body.message || 'N/A'}`
      });
    } catch (mailErr) {
      console.error('Failed to send enquiry email:', mailErr);
    }

    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE enquiry (Admin status, dates, notes)
router.put('/:id', async (req, res) => {
  try {
    const doc = await SubscriptionEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE enquiry
router.delete('/:id', async (req, res) => {
  try {
    const doc = await SubscriptionEnquiry.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK DELETE
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No IDs provided' });
    await SubscriptionEnquiry.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
