const express = require('express');
const router = express.Router();
const CatalogueRequest = require('../models/CatalogueRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEnquiryEmail } = require('../utils/mailer');

// GET all catalogue requests (Admin)
router.get('/', async (req, res) => {
  try {
    const list = await CatalogueRequest.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single catalogue request
router.get('/:id', async (req, res) => {
  try {
    const doc = await CatalogueRequest.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Catalogue request not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create catalogue request (Website / Get Quote Modal)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, companyName, message, catalogues, userId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!catalogues || !Array.isArray(catalogues) || catalogues.length === 0) {
      return res.status(400).json({ message: 'Please select at least one catalogue' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let linkedUserId = userId || null;

    // Link or create User
    try {
      let existingUser = await User.findOne({
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }
      });

      if (!existingUser) {
        existingUser = await User.create({
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          phone: phone || '',
          companyName: companyName || ''
        });
      } else {
        if (!existingUser.phone && phone) existingUser.phone = phone;
        if (!existingUser.name && name) existingUser.name = name;
        await existingUser.save();
      }
      linkedUserId = existingUser._id;
    } catch (userErr) {
      console.error('Error linking user to catalogue request:', userErr);
    }

    const newRequest = await CatalogueRequest.create({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: phone || '',
      companyName: companyName || '',
      message: message || '',
      catalogues: catalogues.map(c => ({
        id: c.id || '',
        title: c.title || 'Catalogue',
        file: c.file || '',
        badge: c.badge || ''
      })),
      status: 'Pending',
      userId: linkedUserId
    });

    // Create Notification for admin
    try {
      const titles = (catalogues || []).map(c => c.title || c.badge).join(', ');
      await Notification.create({
        modelName: 'CatalogueRequest',
        title: 'New Catalogue Request',
        message: `${name || cleanEmail} requested catalogue(s): ${titles}`,
        link: '/admin/inquiry-system/catalogue-requests'
      });
    } catch (notifErr) {
      console.error('Error creating admin notification for catalogue request:', notifErr);
    }

    // Send email alert to admin
    try {
      const catalogueNames = (catalogues || []).map(c => c.title).join('\n• ');
      sendEnquiryEmail({
        product: `Catalogue Request (${catalogues.length} Catalogues)`,
        customer: name || cleanEmail,
        email: cleanEmail,
        phone: phone || 'N/A',
        message: `Requested Catalogues:\n• ${catalogueNames}\n\nClient Note: ${message || 'None'}\n\nStatus: Pending Admin Approval in Admin Panel.`
      });
    } catch (mailErr) {
      console.error('Error sending catalogue enquiry email:', mailErr);
    }

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Error creating catalogue request:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT update request (Status Approve/Reject, Admin Notes)
router.put('/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const doc = await CatalogueRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    if (status) {
      doc.status = status;
      if (status === 'Approved') {
        doc.approvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      doc.adminNotes = adminNotes;
    }

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE catalogue request
router.delete('/:id', async (req, res) => {
  try {
    const doc = await CatalogueRequest.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Catalogue request deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST bulk delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No IDs provided' });
    await CatalogueRequest.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
