const express = require('express');
const router = express.Router();
const crudRouter = require('./crudRouter');
const DomesticLogistics = require('../models/DomesticLogistics');

router.get('/by-order/:orderId', async (req, res) => {
  try {
    const record = await DomesticLogistics.findOne({ orderId: req.params.orderId }).populate('orderId').lean();
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/', crudRouter(DomesticLogistics));

module.exports = router;
