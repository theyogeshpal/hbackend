const express = require('express');
const router = express.Router();
const crudRouter = require('./crudRouter');
const DomesticLogistics = require('../models/DomesticLogistics');

router.get('/by-order/:orderId', async (req, res) => {
  try {
    let record = await DomesticLogistics.findOne({ orderId: req.params.orderId }).populate('orderId').lean();
    if (!record) {
      // Check if order exists and is Shipped, then auto-create
      const Order = require('../models/Order');
      const order = await Order.findById(req.params.orderId);
      if (order && order.status === 'Shipped') {
        const ewayBillNo = 'EWB' + Date.now().toString().slice(-8);
        const newRecord = await DomesticLogistics.create({
          orderId: order._id,
          ewayBillNo: ewayBillNo,
          generatedDate: new Date(),
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          dispatchDetails: {
            placeOfDispatch: 'Jaipur, Rajasthan (08)',
            placeOfDelivery: order.deliveryPort || '',
            portOfExport: 'JNPT Mumbai / Delhi ICD',
            countryOfDestination: order.country || ''
          },
          status: 'Pending'
        });
        // Populate and return the newly created record
        record = await DomesticLogistics.findById(newRecord._id).populate('orderId').lean();
      } else {
        return res.status(404).json({ message: 'Not found or order not shipped' });
      }
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/', crudRouter(DomesticLogistics));

module.exports = router;
