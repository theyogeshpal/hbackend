const express = require('express');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const docs = await Quotation.find().sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/by-inquiry/:id', async (req, res) => {
  try {
    const doc = await Quotation.findOne({ inquiryId: req.params.id }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Quotation.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const doc = await Quotation.create(req.body);
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await Quotation.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    if (req.body.status === 'Accepted' && existing.status !== 'Accepted') {
      const orderNo = 'ORD-' + Date.now().toString().slice(-6);
      await Order.create({
        orderNo,
        quotation: existing.quoteNo,
        status: 'Processing',
        customer: existing.customer,
        country: existing.country,
        address: req.body.address || existing.address || '',
        incoterm: req.body.incoterm || existing.incoterm || '',
        deliveryPort: req.body.deliveryPort || existing.deliveryPort || '',
        products: [{
          name: existing.product || '',
          quantity: existing.qty || '',
          price: existing.rate || ''
        }],
        type: existing.type
      });
    }

    const doc = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Quotation.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({message: 'No IDs provided'});
    await Quotation.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
