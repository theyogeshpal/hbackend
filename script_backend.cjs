const fs = require('fs');
let c = fs.readFileSync('src/routes/orders.js', 'utf8');

c = c.replace(/if \(status === 'Shipped'\) \{/, `
    if (req.body.installments !== undefined || req.body.status === 'Cancelled') {
      const Invoice = require('../models/Invoice');
      const invoice = await Invoice.findOne({ orderNo: order.orderNo });
      if (invoice) {
        const prodList = req.body.products || order.products || [];
        const instList = req.body.installments || order.installments || [];
        
        let totalAmount = prodList.reduce((sum, p) => sum + ((parseFloat(p.quantity)||0) * (parseFloat(p.price)||0)), 0);
        let paidAmount = instList.reduce((sum, inst) => inst.status === 'Paid' ? sum + (parseFloat(inst.amount)||0) : sum, 0);
        
        let newInvStatus = invoice.status;
        const currentStatus = req.body.status || order.status;
        
        if (currentStatus === 'Cancelled') {
          newInvStatus = 'Cancelled';
        } else if (paidAmount === 0) {
          newInvStatus = 'Pending';
        } else if (paidAmount > 0 && paidAmount < totalAmount) {
          newInvStatus = 'Partial Paid';
        } else if (paidAmount > 0 && paidAmount >= totalAmount) {
          newInvStatus = 'Full Paid';
        }
        
        if (newInvStatus !== invoice.status) {
          invoice.status = newInvStatus;
          // also update payout if needed, handled in invoices route ideally, 
          // but we save directly here.
          await invoice.save();
        }
      }
    }

    if (status === 'Shipped') {`);

fs.writeFileSync('src/routes/orders.js', c);
