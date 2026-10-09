const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'indiaexport@hieil.com',
    pass: 'vyrp suzu teun movv'
  }
});

const sendEnquiryEmail = async (enquiryData) => {
  try {
    const {
      product, customer, email, phone, whatsapp, location, 
      orderType, qty, budget, gstStatus, gstDetails, shipping, 
      message, deliveryDate
    } = enquiryData;

    let htmlContent = `
      <h2>New Product Enquiry Received</h2>
      <p>A new product enquiry has been submitted on the website.</p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="background:#f4f4f4;"><strong>Product</strong></td><td>${product || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Customer Name</strong></td><td>${customer || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Email</strong></td><td>${email || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Phone</strong></td><td>${phone || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>WhatsApp</strong></td><td>${whatsapp || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Location</strong></td><td>${location || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Order Type</strong></td><td>${orderType || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Quantity</strong></td><td>${qty || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Budget</strong></td><td>${budget || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>GST Status</strong></td><td>${gstStatus || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>GST Details</strong></td><td>${gstDetails || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Shipping Preference</strong></td><td>${shipping || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Expected Delivery</strong></td><td>${deliveryDate || 'N/A'}</td></tr>
        <tr><td style="background:#f4f4f4;"><strong>Message</strong></td><td>${message || 'N/A'}</td></tr>
      </table>
      <br/>
      <p>Please log in to the admin panel to view more details and reply to the customer.</p>
    `;

    const mailOptions = {
      from: 'indiaexport@hieil.com',
      to: 'indiaexport@hieil.com',
      subject: `New Product Enquiry - ${product || 'Unknown Product'}`,
      html: htmlContent,
      replyTo: email || 'indiaexport@hieil.com'
    };

    await transporter.sendMail(mailOptions);
    console.log('Enquiry email sent successfully.');
  } catch (error) {
    console.error('Error sending enquiry email:', error);
  }
};

module.exports = { sendEnquiryEmail };
