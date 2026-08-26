const express = require('express');
const Order = require('../models/Order');
const DomesticLogistics = require('../models/DomesticLogistics');
const crudRouter = require('./crudRouter');

const router = express.Router();

router.put('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status === 'Shipped') {
      const order = await Order.findById(req.params.id);
      if (order) {
        // Check if logistics record already exists
        const existing = await DomesticLogistics.findOne({ orderId: order._id });
        if (!existing) {
          // Generate a random E-Way bill number if needed, or leave blank for user to fill
          const ewayBillNo = 'EWB' + Date.now().toString().slice(-8);
          await DomesticLogistics.create({
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
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

router.use('/', crudRouter(Order));

module.exports = router;
