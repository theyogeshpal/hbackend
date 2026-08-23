const express = require('express');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [
      categories, products, orders, blogs, payments
    ] = await Promise.all([
      require('../models/Category').countDocuments(),
      require('../models/Product').countDocuments(),
      require('../models/Order').countDocuments(),
      require('../models/Blog').countDocuments(),
      require('../models/Payment').find({}, { amount: 1 }).lean()
    ]);

    const revenue = payments.reduce((sum, p) => {
      const amt = parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + amt;
    }, 0);

    const avgRate = orders > 0 ? Math.round(revenue / orders) : 0;

    res.json({ categories, products, orders, blogs, revenue, avgRate });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/latest-orders', async (req, res) => {
  try {
    const orders = await require('../models/Order').find().sort({ createdAt: -1 }).limit(5);
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/reports', async (req, res) => {
  try {
    const [
      inquiries, quotations, orders, pendingInvoices, vendorPayoutsDue, payments,
      totalShipments, inTransitShipments, deliveredShipments
    ] = await Promise.all([
      require('../models/Inquiry').countDocuments(),
      require('../models/Quotation').countDocuments(),
      require('../models/Order').countDocuments(),
      require('../models/Invoice').countDocuments({ status: { $in: ['Pending', 'Unpaid', 'pending'] } }),
      require('../models/VendorPayout').countDocuments({ status: { $in: ['Hold', 'Pending', 'pending', 'hold'] } }),
      require('../models/Payment').find({}, { amount: 1 }).lean(),
      require('../models/Shipping').countDocuments(),
      require('../models/Shipping').countDocuments({ status: { $regex: /in transit/i } }),
      require('../models/Shipping').countDocuments({ status: { $regex: /delivered/i } })
    ]);

    const gstCollected = payments.reduce((sum, p) => {
      const amt = parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0;
      // Rough estimation: assuming GST is included in the amount, we will just return a simple calc or 0
      return sum + (amt * 0.18); 
    }, 0);

    res.json({
      inquiries,
      quotations,
      orders,
      pendingPayments: pendingInvoices,
      vendorPayoutsDue,
      gstCollected,
      totalShipments,
      inTransitShipments,
      deliveredShipments
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    const Payment = require('../models/Payment');

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // 1 & 2. Monthly Orders and Revenue
    const monthlyOrders = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    const ordersThisYear = await Order.find({ createdAt: { $gte: startOfYear } }, { createdAt: 1 });
    ordersThisYear.forEach(order => {
      const month = new Date(order.createdAt).getMonth();
      monthlyOrders[month] += 1;
    });

    const paymentsThisYear = await Payment.find({ createdAt: { $gte: startOfYear } }, { amount: 1, createdAt: 1 }).lean();
    let totalYearRevenue = 0;
    paymentsThisYear.forEach(p => {
      const amt = parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0;
      const month = new Date(p.createdAt).getMonth();
      monthlyRevenue[month] += amt;
      totalYearRevenue += amt;
    });

    // 3. Product Category Distribution
    const categories = await Category.find({}, { name: 1 }).lean();
    const catMap = {};
    categories.forEach(c => catMap[c._id] = c.name);

    const productCatStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const categoryDistribution = productCatStats.map(stat => {
      return [catMap[stat._id] || 'Unknown', stat.count];
    }).sort((a, b) => b[1] - a[1]).slice(0, 5); // top 5

    // 4. Order Fulfillment Status
    const statusStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const fulfillmentDistribution = statusStats.map(stat => {
      return [stat._id || 'Pending', stat.count];
    });

    res.json({
      monthlyOrders,
      monthlyRevenue,
      totalYearRevenue,
      categoryDistribution: categoryDistribution.length ? categoryDistribution : [['No Data', 1]],
      fulfillmentDistribution: fulfillmentDistribution.length ? fulfillmentDistribution : [['No Data', 1]]
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
