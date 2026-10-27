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
    const data = { ...req.body };
    if (!data.name && data.email) {
      data.name = data.email.split('@')[0];
    }
    if (!data.planId || data.planId === 'null' || data.planId === '') {
      data.planId = null;
    }
    if (!data.planName) {
      data.planName = '';
    }

    const doc = await SubscriptionEnquiry.create(data);

    // Auto-create user account if email provided or link to existing
    if (data.email) {
      try {
        const cleanEmail = data.email.toLowerCase().trim();
        let existingUser = await User.findOne({
          email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }
        });
        if (!existingUser) {
          existingUser = await User.create({
            email: cleanEmail,
            name: data.name || cleanEmail.split('@')[0],
            phone: data.phone || '',
            companyName: data.companyName || ''
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
      const planTitle = data.planName ? data.planName : 'General Sourcing Consultation';
      await Notification.create({
        modelName: 'SubscriptionEnquiry',
        title: 'New Subscription Enquiry',
        message: `${data.name || 'A customer'} (${data.email}) enquired about ${planTitle}.`,
        link: '/admin/membership-enquiries'
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Send email notification to admin
    try {
      sendEnquiryEmail({
        customer: data.name || data.email,
        email: data.email,
        phone: data.phone,
        product: data.planName ? `Subscription: ${data.planName} (${data.duration || ''} - ${data.price || ''})` : 'General Sourcing Consultation (No Specific Plan)',
        message: `Plan: ${data.planName || 'No Product / General Consultation'}\nCompany: ${data.companyName || 'N/A'}\nCategories: ${data.productCategories || 'N/A'}\nTarget Market: ${data.targetMarket || 'N/A'}\nExpected Order Size: ${data.expectedOrderSize || 'N/A'}\nMessage: ${data.message || 'Direct inquiry from website'}`
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
