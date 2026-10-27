const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');

const defaultPlans = [
  {
    name: 'HIEIL Essential',
    duration: '3 months',
    price: '$1,499',
    originalPrice: '$1,799',
    perDayCost: '$16.65 / day',
    offerBadge: 'Save $300',
    targetAudience: 'For new importers, independent retailers and boutique businesses.',
    features: [
      'Eligible catalogue at verified manufacturer prices',
      'Custom-design sourcing from your images or specifications',
      'MOQ guidance, generally from 100 pieces where applicable',
      'Product specification sheets before order confirmation',
      'Pre-production sample coordination',
      'Photo and video updates during production, where available',
      'Pre-dispatch inspection coordination',
      'Export packaging guidance and one sourcing consultation',
      'Email support and order-status updates'
    ],
    promise: 'Start sourcing without building a supplier network from scratch.',
    isPopular: false,
    order: 1,
    status: 'Active'
  },
  {
    name: 'HIEIL Business',
    duration: '6 months',
    price: '$2,499',
    originalPrice: '$2,999',
    perDayCost: '$13.88 / day',
    offerBadge: 'Save $500',
    targetAudience: 'For growing retailers, importers and gift businesses.',
    extraHeader: 'Everything in Essential, plus',
    features: [
      'Priority sourcing across multiple categories',
      'Consolidated quotations from multiple manufacturers',
      'Supplier price, specification and lead-time comparison',
      'Private-label and packaging customisation coordination',
      'Agreed inspection checkpoints and milestone progress reports',
      'Material, finish and measurement verification',
      'SEO-friendly descriptions for up to 20 products',
      'Buyer-ready digital catalogue support',
      'Priority account coordination and monthly sourcing review'
    ],
    promise: 'A more consistent supply chain with less time spent chasing manufacturers.',
    isPopular: true,
    popularTag: 'Most Popular',
    order: 2,
    status: 'Active'
  },
  {
    name: 'HIEIL Global Partner',
    duration: '12 months',
    price: '$3,999',
    originalPrice: '$4,999',
    perDayCost: '$10.95 / day',
    offerBadge: 'Save $1,000',
    targetAudience: 'For wholesalers, established importers and multi-store retailers.',
    extraHeader: 'Everything in Business, plus',
    features: [
      'Annual sourcing and collection planning session',
      'Custom collection development coordination',
      'Private-label and branded packaging projects',
      'Dedicated account coordinator',
      'Repeat-order forecasting and production scheduling',
      'SEO-friendly content for up to 50 products',
      'Annual catalogue refresh and seasonal merchandising',
      'Preferential order service-fee terms in your contract',
      'First access to selected new collections',
      'Agreed exclusivity for qualifying custom designs, where achievable'
    ],
    promise: 'A long-term sourcing partnership in India, from design to repeat orders.',
    isPopular: false,
    order: 3,
    status: 'Active'
  }
];

// Helper to sanitize features if passed as string
const sanitizeBody = (body) => {
  if (typeof body.features === 'string') {
    body.features = body.features
      .split('\n')
      .map(s => s.trim().replace(/^[-*•◆\d.]+\s*/, ''))
      .filter(Boolean);
  }
  return body;
};

// GET all plans
router.get('/', async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find().sort({ order: 1, createdAt: 1 }).lean();
    if (plans.length === 0) {
      await SubscriptionPlan.insertMany(defaultPlans);
      plans = await SubscriptionPlan.find().sort({ order: 1, createdAt: 1 }).lean();
    }
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id).lean();
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE plan
router.post('/', async (req, res) => {
  try {
    const data = sanitizeBody(req.body);
    const plan = await SubscriptionPlan.create(data);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE plan
router.put('/:id', async (req, res) => {
  try {
    const data = sanitizeBody(req.body);
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk Delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No IDs provided' });
    await SubscriptionPlan.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
