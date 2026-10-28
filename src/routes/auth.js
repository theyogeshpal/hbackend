const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions || {} } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Seed default admin (run once)
router.get('/seed', async (req, res) => {
  try {
    const exists = await Admin.findOne({ email: 'hieil@gmail.com' });
    if (exists) return res.json({ message: 'Admin already exists' });
    const hashed = await bcrypt.hash('admin@123', 10);
    await Admin.create({ email: 'hieil@gmail.com', password: hashed, name: 'Hieil Admin', role: 'superadmin' });
    res.json({ message: 'Admin seeded successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update credentials
router.put('/update-credentials', authMiddleware, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });
      admin.password = await bcrypt.hash(newPassword, 10);
    }
    
    if (email) admin.email = email;
    
    await admin.save();
    res.json({ message: 'Credentials updated successfully', admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions || {} } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
