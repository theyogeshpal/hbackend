const express = require('express');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().lean();
    const payouts = await VendorPayout.find().lean();

    const reportData = vendors.map(vendor => {
      const vendorPayouts = payouts.filter(p => String(p.vendorId) === String(vendor._id));
      
      let totalInvoiceAmount = 0;
      let totalPayout = 0;
      let released = 0;
      let pending = 0;

      vendorPayouts.forEach(p => {
        const invAmt = parseFloat(p.invoiceAmount) || 0;
        const payAmt = parseFloat(p.payoutAmount) || 0;
        
        totalInvoiceAmount += invAmt;
        totalPayout += payAmt;
        
        if (p.status === 'Released' || p.status === 'Paid') {
          released += payAmt;
        } else {
          pending += payAmt;
        }
      });

      return {
        _id: vendor._id,
        id: vendor._id, // Add id for table
        vendorName: vendor.vendorName,
        totalInvoices: vendorPayouts.length,
        totalInvoiceAmount: totalInvoiceAmount.toFixed(2),
        totalCommission: vendor.amount || vendor.commission || '0', // The vendor's standard commission rate / amount
        totalPayout: totalPayout.toFixed(2),
        released: released.toFixed(2),
        pending: pending.toFixed(2)
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
