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
    
    // Check if status is changing to Paid and it wasn't Paid before
    if (status === 'Paid' && invoice.status !== 'Paid') {
      // Determine which vendorId to use (from request body or existing invoice)
      const vId = vendorId || invoice.vendorId;
      
      if (vId) {
        // Fetch the vendor to get their commission percentage
        const vendor = await Vendor.findById(vId);
        if (vendor) {
          const commPercent = parseFloat(vendor.amount || vendor.commission) || 0;
          const invAmt = parseFloat(invoice.total) || 0;
          
          // Calculate payout amount
          const payoutAmt = (invAmt * commPercent) / 100;
          
          // Create Vendor Payout
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
    
    // Forward the request to normal update logic
    next();
  } catch (err) {
    next(err);
  }
});

// Mount the generic crudRouter below custom routes
// Note: retailerInvoices defaults to retailer type
router.use('/', (req, res, next) => {
  if (req.method === 'POST') req.body.type = 'retailer';
  next();
}, crudRouter(Invoice));

module.exports = router;
