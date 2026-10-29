const express = require('express');

// Creates standard GET all, GET one, POST, PUT, DELETE routes for a model
const crudRouter = (Model) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      let query = Model.find().sort({ createdAt: -1 });
      if (Model.schema.paths.vendorId) {
        query = query.populate('vendorId', 'vendorName');
      }
      const docs = await query.lean();
      res.json(docs);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const data = { ...req.body };
      delete data._id;
      delete data.id;
      delete data.__v;
      delete data.createdAt;
      delete data.updatedAt;
      const doc = await Model.create(data);
      
      // Create notification for enquiry models
      const enquiryModels = ['Inquiry', 'Contact', 'ServiceInquiry', 'ProductCQ', 'BulkFmoq', 'Feedback', 'DownloadLead'];
      if (enquiryModels.includes(Model.modelName)) {
        try {
          const Notification = require('../models/Notification');
          let name = req.body.name || req.body.firstName || req.body.fullName || req.body.customerName || 'Someone';
          let title = `New ${Model.modelName}`;
          let message = `${name} submitted a new ${Model.modelName.toLowerCase()}.`;
          let link = '/admin/dashboard';

          if (Model.modelName === 'Inquiry') {
            title = 'New Product Inquiry';
            const productInfo = req.body.productName || req.body.product || 'a product';
            message = `Inquiry from ${name} for ${productInfo}.`;
            link = '/admin/inquiry-system/product-inquiries';
            // Send Email
            const { sendEnquiryEmail } = require('../utils/mailer');
            sendEnquiryEmail(req.body);
          } else if (Model.modelName === 'Contact') {
            title = 'New Contact Message';
            message = `Contact message received from ${name}.`;
            link = '/admin/contact';
          } else if (Model.modelName === 'ServiceInquiry') {
            title = 'New Service Inquiry';
            const serviceName = req.body.service || req.body.subService || 'a service';
            message = `Service inquiry from ${name} for ${serviceName}.`;
            link = '/admin/service-inquiries';
          } else if (Model.modelName === 'ProductCQ') {
            title = 'New Custom Product Quote';
            const cat = req.body.category || 'a category';
            message = `Quote requested by ${name} in ${cat}.`;
            link = '/admin/product-cq';
          } else if (Model.modelName === 'BulkFmoq') {
            title = 'New Bulk/Wholesale Inquiry';
            message = `Bulk inquiry submitted by ${name}.`;
            link = '/admin/bulk-fmoq';
          } else if (Model.modelName === 'Feedback') {
            title = 'New Customer Feedback';
            message = `Feedback submitted by ${name}.`;
            link = '/admin/submissions/feedback';
          } else if (Model.modelName === 'DownloadLead') {
            title = 'New Certificate Download';
            message = `${name} downloaded a certificate.`;
            link = '/admin/download-leads';
          }
          
          
          await Notification.create({
            modelName: Model.modelName,
            title,
            message,
            link
          });
          
          // Auto-create user account if email provided
          if (req.body.email) {
            const User = require('../models/User');
            let existingUser = await User.findOne({ email: req.body.email });
            if (!existingUser) {
              existingUser = await User.create({
                email: req.body.email,
                name: req.body.name || req.body.customer || req.body.customerName || 'User',
                phone: req.body.phone || ''
              });
            }
            if (Model.modelName === 'Inquiry') {
              doc.userId = existingUser._id;
              await doc.save();
            }
          }

        } catch (notifErr) {
          console.error('Failed to create notification:', notifErr);
        }
      }

      res.status(201).json(doc);
    } catch (e) { res.status(400).json({ message: e.message }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      const doc = await Model.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(400).json({ message: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  router.post('/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({message: 'No IDs provided'});
      await Model.deleteMany({ _id: { $in: ids } });
      res.json({ message: 'Deleted successfully' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  return router;
};

module.exports = crudRouter;
