const express = require('express');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const crudRouter = require('./crudRouter');

const router = express.Router();

// Custom PUT route to intercept status updates
router.put('/:id', async (req, res, next) => {
  try {
    const { status, vendorId } = req.body;
    
    // Fetch the existing invoice to see if status is changing to 'Paid'
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    // If a new vendorId is assigned or already exists, ensure a VendorPayout is created/updated
    const vId = vendorId || invoice.vendorId;
    if (vId) {
      // Find if payout exists for this invoice
      let payout = await VendorPayout.findOne({ invoiceId: invoice.invoiceNo });
      
      const vendor = await Vendor.findById(vId);
      if (vendor) {
        const commPercent = parseFloat(vendor.amount || vendor.commission) || 0;
        const invAmt = parseFloat(invoice.total) || 0;
        const payoutAmt = (invAmt * commPercent) / 100;
        
        let payoutStatus = 'Pending';
        // If invoice is becoming Paid, or is already Paid, payout becomes Hold (ready for release)
        if (status === 'Paid' || invoice.status === 'Paid') {
          payoutStatus = 'Hold';
        }

        if (payout) {
          // Update existing payout
          payout.vendorId = vendor._id;
          payout.invoiceAmount = invAmt.toFixed(2);
          payout.commission = commPercent.toString() + '%';
          payout.payoutAmount = payoutAmt.toFixed(2);
          payout.status = payoutStatus;
          await payout.save();
        } else {
          // Create new payout
          await VendorPayout.create({
            invoiceId: invoice.invoiceNo,
            invoiceAmount: invAmt.toFixed(2),
            commission: commPercent.toString() + '%',
            payoutAmount: payoutAmt.toFixed(2),
            status: payoutStatus,
            vendorId: vendor._id
          });
        }
      }
    }
    // Forward the request to normal update logic
    next();
  } catch (err) {
    next(err);
  }
});

// Mount the generic crudRouter below custom routes
router.use('/', crudRouter(Invoice));

module.exports = router;
