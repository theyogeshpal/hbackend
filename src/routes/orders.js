const express = require('express');
const Order = require('../models/Order');
const DomesticLogistics = require('../models/DomesticLogistics');
const crudRouter = require('./crudRouter');

const router = express.Router();

router.put('/:id', async (req, res, next) => {
  try {
    const { status, installments, products } = req.body;
    
    // Auto-update Invoice status based on installments or order cancellation
    if (installments !== undefined || status === 'Cancelled' || products !== undefined) {
      const order = await Order.findById(req.params.id);
      if (order) {
        const Invoice = require('../models/Invoice');
        const invoice = await Invoice.findOne({ orderNo: order.orderNo });
        
        if (invoice) {
          const prodList = products || order.products || [];
          const instList = installments || order.installments || [];
          
          let totalAmount = prodList.reduce((sum, p) => sum + ((parseFloat(p.quantity)||0) * (parseFloat(p.price)||0)), 0);
          let paidAmount = instList.reduce((sum, inst) => inst.status === 'Paid' ? sum + (parseFloat(inst.amount)||0) : sum, 0);
          
          let newInvStatus = invoice.status;
          const currentStatus = status || order.status;
          
          if (currentStatus === 'Cancelled') {
            newInvStatus = 'Cancelled';
          } else if (paidAmount === 0) {
            newInvStatus = 'Pending';
          } else if (paidAmount > 0 && paidAmount < totalAmount) {
            newInvStatus = 'Partial Paid';
          } else if (paidAmount > 0 && paidAmount >= totalAmount) {
            newInvStatus = 'Full Paid';
          }
          
          let isChanged = false;
          if (newInvStatus !== invoice.status) { 
            invoice.status = newInvStatus; 
            isChanged = true; 
          }
          if (totalAmount.toString() !== invoice.total) { 
            invoice.total = totalAmount.toString(); 
            isChanged = true; 
          }
          if (isChanged) {
            await invoice.save();
          }
        }
      }
    }

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
