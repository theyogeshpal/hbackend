const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const userAuth = require('../middleware/userAuth');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, companyName } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      companyName
    });

    // Generate Token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current User Profile
router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle Wishlist
router.post('/wishlist/toggle', userAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const index = user.wishlist.indexOf(productId);
    if (index === -1) { user.wishlist.push(productId); } else { user.wishlist.splice(index, 1); }
    await user.save();
    res.json(user.wishlist);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get Wishlist Details
router.get('/wishlist', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get User Inquiries
router.get('/inquiries', userAuth, async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const Quotation = require('../models/Quotation');
    const inquiries = await Inquiry.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const inquiryIds = inquiries.map(i => i._id.toString());
    const quotations = await Quotation.find({
      $or: [{ userId: req.user.id }, { inquiryId: { $in: inquiryIds } }]
    }).sort({ createdAt: -1 });
    res.json({ inquiries, quotations });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Accept Quotation
router.post('/quotations/:id/accept', userAuth, async (req, res) => {
  try {
    const Quotation = require('../models/Quotation');
    const Inquiry = require('../models/Inquiry');
    const Notification = require('../models/Notification');
    const Order = require('../models/Order');
    const inquiries = await Inquiry.find({ userId: req.user.id }).lean();
      const inquiryIds = inquiries.map(i => i._id.toString());
      const quotation = await Quotation.findOne({ _id: req.params.id, $or: [{ userId: req.user.id }, { inquiryId: { $in: inquiryIds } }] });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    quotation.status = 'Accepted';
    await quotation.save();
    if (quotation.inquiryId) {
      await Inquiry.findByIdAndUpdate(quotation.inquiryId, { status: 'Accepted' });
    }
    // Create Notification for Admin
    await Notification.create({
      title: 'Quotation Accepted',
      message: 'User ' + req.user.name + ' accepted Quotation #' + (quotation.quoteNo || quotation._id),
      modelName: 'Order',
        link: '/admin/inquiry-system/orders',
      isRead: false
    });
    // Create Order
    await Order.create({
      userId: req.user.id,
      quotationId: quotation._id,
      orderNo: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customerName: quotation.customer,
      email: quotation.customerEmail,
      product: quotation.product,
      totalAmount: quotation.total,
      status: 'Pending'
    });
    res.json({ message: 'Quotation accepted and order placed successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get User Orders
router.get('/orders', userAuth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
