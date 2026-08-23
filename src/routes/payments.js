const express = require('express');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const crudRouter = require('./crudRouter');

const router = express.Router();

router.put('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) return res.status(404).json({ message: 'Not found' });

    // If status is changing to Paid
    if (status === 'Paid' && payment.status !== 'Paid') {
      if (payment.invoiceNo) {
        // Find the corresponding invoice
        const invoice = await Invoice.findOne({ invoiceNo: payment.invoiceNo });
        if (invoice && invoice.status !== 'Paid') {
          // Update Invoice status
          invoice.status = 'Paid';
          await invoice.save();

          // Generate Payout if vendor assigned
          if (invoice.vendorId) {
            const vendor = await Vendor.findById(invoice.vendorId);
            if (vendor) {
              const commPercent = parseFloat(vendor.amount || vendor.commission) || 0;
              const invAmt = parseFloat(invoice.total) || 0;
              const payoutAmt = (invAmt * commPercent) / 100;

              await VendorPayout.create({
                invoiceId: invoice.invoiceNo,
                invoiceAmount: invAmt.toFixed(2),
                commission: commPercent.toString() + '%',
                payoutAmount: payoutAmt.toFixed(2),
                status: 'Hold',
                vendorId: vendor._id
              });
            }
          }
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

router.use('/', crudRouter(Payment));

module.exports = router;
