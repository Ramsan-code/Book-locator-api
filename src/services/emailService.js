import nodemailer from "nodemailer";

/**
 * Email Service for BookLink
 * Handles all email notifications
 */

// Create reusable transporter
const createTransporter = () => {
  // For development: Use Ethereal Email (fake SMTP)
  // For production: Use Gmail, SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === "production") {
    // Production configuration (Gmail example)
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  } else {
    // Development configuration (Ethereal)
    // Note: You need to create an Ethereal account or use mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ethereal.email",
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER || "your-ethereal-user@ethereal.email",
        pass: process.env.EMAIL_PASSWORD || "your-ethereal-password",
      },
    });
  }
};

// Email templates
const emailTemplates = {
  // User approval email
  userApproval: (userName, userEmail) => ({
    subject: " Your BookLink Account Has Been Approved!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> Welcome to BookLink!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}! </h2>
            <p>Great news! Your BookLink account has been approved by our admin team.</p>
            
            <p><strong>You can now:</strong></p>
            <ul>
              <li> List your books for sale or rent</li>
              <li> Browse and purchase books</li>
              <li> Leave reviews and ratings</li>
              <li> Connect with other book lovers</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Start Exploring Books
              </a>
            </center>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy reading! </p>
            <p><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email from BookLink. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${userName}!
      
      Great news! Your BookLink account has been approved.
      
      You can now:
      - List your books for sale or rent
      - Browse and purchase books
      - Leave reviews and ratings
      - Connect with other book lovers
      
      Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      Happy reading!
      The BookLink Team
    `,
  }),

  // User rejection email (optional)
  userRejection: (userName, reason) => ({
    subject: "BookLink Account Application Update",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> BookLink Account Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for your interest in BookLink.</p>
            <p>Unfortunately, we're unable to approve your account at this time.</p>
            
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            
            <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Book approval email
  bookApproval: (userName, bookTitle, bookId) => ({
    subject: ` Your Book "${bookTitle}" Has Been Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> Book Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}! </h2>
            <p>Excellent news! Your book listing has been approved and is now live on BookLink.</p>
            
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li> Your book is now visible to all users</li>
              <li> Buyers can purchase or rent it</li>
              <li> Track views and interest in your dashboard</li>
              <li> You'll be notified of any inquiries</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/books/${bookId}" class="button">
                View Your Listing
              </a>
            </center>
            
            <p>Thank you for contributing to our book community!</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Book rejection email
  bookRejection: (userName, bookTitle, reason) => ({
    subject: `Book Listing Update: "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> Book Listing Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for submitting your book listing to BookLink.</p>
            <p>After review, we're unable to approve the following book at this time:</p>
            
            <p><strong>Book Title:</strong> ${bookTitle}</p>
            
            <div class="reason-box">
              <p><strong> Reason for rejection:</strong></p>
              <p>${reason || 'Does not meet our listing quality standards'}</p>
            </div>
            
            <p><strong>What you can do:</strong></p>
            <ul>
              <li> Update your listing to address the concerns</li>
              <li> Add better quality images</li>
              <li> Improve the description</li>
              <li> Contact support if you have questions</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-books" class="button">
                Update Your Listing
              </a>
            </center>
            
            <p>We appreciate your understanding and look forward to seeing your updated listing!</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Transaction notification
  transactionCreated: (sellerName, buyerName, bookTitle, transactionType, price) => ({
    subject: ` New ${transactionType} Request: "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .transaction-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> New Transaction!</h1>
          </div>
          <div class="content">
            <h2>Hello ${sellerName}! </h2>
            <p>You have a new ${transactionType.toLowerCase()} request for your book!</p>
            
            <div class="transaction-details">
              <p><strong> Book:</strong> ${bookTitle}</p>
              <p><strong> ${transactionType === 'Buy' ? 'Buyer' : 'Renter'}:</strong> ${buyerName}</p>
              <p><strong> Amount:</strong> $${price.toFixed(2)}</p>
              <p><strong> Type:</strong> ${transactionType}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li> Check your transaction dashboard</li>
              <li> Contact the ${transactionType === 'Buy' ? 'buyer' : 'renter'} if needed</li>
              <li> Arrange pickup/delivery details</li>
              <li> Mark as completed when done</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/transactions" class="button">
                View Transaction
              </a>
            </center>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Welcome email for new users
  welcomeEmail: (userName, userEmail) => ({
    subject: " Welcome to BookLink!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> Welcome to BookLink!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}! </h2>
            <p>Thank you for joining BookLink, the community marketplace for book lovers!</p>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li> Your account is pending approval (usually within 24 hours)</li>
              <li> You'll receive an email once approved</li>
              <li> Then you can start listing and buying books</li>
            </ul>
            
            <p><strong>While you wait, you can:</strong></p>
            <ul>
              <li> Complete your profile</li>
              <li> Browse available books</li>
              <li> Explore different genres</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/books" class="button">
                Browse Books
              </a>
            </center>
            
            <p>We're excited to have you in our community!</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Request accepted - Email to buyer with seller contact info
  requestAccepted: (buyerName, sellerName, sellerEmail, sellerPhone, sellerAddress, bookTitle, bookAuthor, price) => ({
    subject: ` Your Request for "${bookTitle}" Has Been Accepted!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .contact-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #11998e; }
          .contact-item { margin: 10px 0; padding: 10px; background: #f0f9ff; border-radius: 3px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Request Accepted!</h1>
          </div>
          <div class="content">
            <h2>Great News, ${buyerName}!</h2>
            <p><strong>${sellerName}</strong> has accepted your request for <strong>"${bookTitle}"</strong> by ${bookAuthor}.</p>
            
            <p><strong>Price:</strong> Rs. ${price}</p>
            
            <div class="contact-box">
              <h3>📞 Seller Contact Information</h3>
              <p>You can now contact the seller to arrange the book handover:</p>
              
              <div class="contact-item">
                <strong>👤 Name:</strong> ${sellerName}
              </div>
              <div class="contact-item">
                <strong>📧 Email:</strong> ${sellerEmail}
              </div>
              <div class="contact-item">
                <strong>📱 Phone:</strong> ${sellerPhone}
              </div>
              <div class="contact-item">
                <strong>📍 Location:</strong> ${sellerAddress}
              </div>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Contact the seller using the information above</li>
              <li>Arrange a convenient time and place to meet</li>
              <li>Inspect the book before payment</li>
              <li>Complete the transaction safely</li>
            </ul>
            
            <p><strong>Safety Tips:</strong></p>
            <ul>
              <li>Meet in a public place</li>
              <li>Bring exact change if paying cash</li>
              <li>Inspect the book condition</li>
              <li>Trust your instincts</li>
            </ul>
            
            <p>Happy reading!</p>
            <p><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Request accepted - Email to seller with buyer contact info
  requestAcceptedSeller: (sellerName, buyerName, buyerEmail, buyerPhone, buyerAddress, bookTitle, bookAuthor, price) => ({
    subject: ` You Accepted a Request for "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .contact-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .contact-item { margin: 10px 0; padding: 10px; background: #f0f9ff; border-radius: 3px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Request Accepted</h1>
          </div>
          <div class="content">
            <h2>Hello ${sellerName},</h2>
            <p>You have accepted <strong>${buyerName}'s</strong> request for your book <strong>"${bookTitle}"</strong> by ${bookAuthor}.</p>
            
            <p><strong>Price:</strong> Rs. ${price}</p>
            
            <div class="contact-box">
              <h3>📞 Buyer Contact Information</h3>
              <p>Here are the buyer's details to arrange the book handover:</p>
              
              <div class="contact-item">
                <strong>👤 Name:</strong> ${buyerName}
              </div>
              <div class="contact-item">
                <strong>📧 Email:</strong> ${buyerEmail}
              </div>
              <div class="contact-item">
                <strong>📱 Phone:</strong> ${buyerPhone}
              </div>
              <div class="contact-item">
                <strong>📍 Location:</strong> ${buyerAddress}
              </div>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Wait for the buyer to contact you, or reach out first</li>
              <li>Arrange a convenient time and place to meet</li>
              <li>Prepare the book for handover</li>
              <li>Complete the transaction safely</li>
            </ul>
            
            <p><strong>Safety Tips:</strong></p>
            <ul>
              <li>Meet in a public place during daylight</li>
              <li>Bring the book in good condition as described</li>
              <li>Verify payment before handing over the book</li>
              <li>Trust your instincts</li>
            </ul>
            
            <p>Thank you for being part of our community!</p>
            <p><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Commission payment request
  commissionPaymentRequest: (userName, bookTitle, bookPrice, commissionAmount, role) => ({
    subject: `💰 Commission Payment Required for "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .amount { font-size: 32px; font-weight: bold; color: #f5576c; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Commission Payment Required</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Great news! The ${role === 'buyer' ? 'seller has accepted your request' : 'buyer has requested your book'}.</p>
            
            <div class="info-box">
              <p><strong>📖 Book:</strong> ${bookTitle}</p>
              <p><strong>💵 Book Price:</strong> Rs. ${bookPrice}</p>
              <p><strong>👥 Your Role:</strong> ${role === 'buyer' ? 'Buyer' : 'Seller'}</p>
            </div>
            
            <h3>📋 Next Step: Pay Commission</h3>
            <p>To proceed with this transaction, please pay a small commission fee:</p>
            
            <div class="amount">
              Rs. ${commissionAmount}
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
              (8% of book price)
            </p>
            
            <h3>🔒 Why Commission?</h3>
            <ul>
              <li><strong>Trust & Safety:</strong> Ensures both parties are serious</li>
              <li><strong>Platform Maintenance:</strong> Helps us keep the platform running</li>
              <li><strong>Contact Exchange:</strong> Once both pay, you'll receive contact details</li>
            </ul>
            
            <h3>📝 How It Works:</h3>
            <ol>
              <li>You pay Rs. ${commissionAmount} commission</li>
              <li>${role === 'buyer' ? 'Seller' : 'Buyer'} also pays Rs. ${commissionAmount} commission</li>
              <li>Admin shares contact information with both parties</li>
              <li>You meet in person and exchange the book for Rs. ${bookPrice} cash</li>
            </ol>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-transactions" class="button">
                Pay Commission Now
              </a>
            </center>
            
            <p><strong>Important:</strong> The Rs. ${bookPrice} book price will be paid directly between you and the ${role === 'buyer' ? 'seller' : 'buyer'} when you meet. Our platform only collects the Rs. ${commissionAmount} commission.</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Commission payment confirmed
  commissionPaymentConfirmed: (userName, bookTitle, commissionAmount, role) => ({
    subject: `✅ Commission Payment Received for "${bookTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you, ${userName}!</h2>
            
            <div class="success-box">
              <h3 style="margin-top: 0;">✅ Commission Payment Received</h3>
              <p><strong>Amount:</strong> Rs. ${commissionAmount}</p>
              <p><strong>Book:</strong> ${bookTitle}</p>
              <p><strong>Status:</strong> Payment confirmed</p>
            </div>
            
            <h3>📋 What Happens Next?</h3>
            <p>We're waiting for the ${role === 'buyer' ? 'seller' : 'buyer'} to pay their commission (Rs. ${commissionAmount}).</p>
            
            <p><strong>Once both parties have paid:</strong></p>
            <ul>
              <li>✉️ You'll receive an email with ${role === 'buyer' ? 'seller' : 'buyer'}'s contact information</li>
              <li>📞 You can contact them to arrange a meeting</li>
              <li>🤝 Meet in person to exchange the book</li>
            </ul>
            
            <p><strong>Reminder:</strong> The book price (full amount) will be paid directly when you meet. You've only paid the platform commission.</p>
            
            <p>We'll notify you as soon as the other party completes their payment!</p>
            
            <p>Best regards,<br><strong>The BookLink Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BookLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    
    // Get template
    let emailContent;
    switch (template) {
      case "userApproval":
        emailContent = emailTemplates.userApproval(data.userName, data.userEmail);
        break;
      case "userRejection":
        emailContent = emailTemplates.userRejection(data.userName, data.reason);
        break;
      case "bookApproval":
        emailContent = emailTemplates.bookApproval(data.userName, data.bookTitle, data.bookId);
        break;
      case "bookRejection":
        emailContent = emailTemplates.bookRejection(data.userName, data.bookTitle, data.reason);
        break;
      case "transactionCreated":
        emailContent = emailTemplates.transactionCreated(
          data.sellerName,
          data.buyerName,
          data.bookTitle,
          data.transactionType,
          data.price
        );
        break;
      case "welcomeEmail":
        emailContent = emailTemplates.welcomeEmail(data.userName, data.userEmail);
        break;
      case "requestAccepted":
        emailContent = emailTemplates.requestAccepted(
          data.buyerName,
          data.sellerName,
          data.sellerEmail,
          data.sellerPhone,
          data.sellerAddress,
          data.bookTitle,
          data.bookAuthor,
          data.price
        );
        break;
      case "requestAcceptedSeller":
        emailContent = emailTemplates.requestAcceptedSeller(
          data.sellerName,
          data.buyerName,
          data.buyerEmail,
          data.buyerPhone,
          data.buyerAddress,
          data.bookTitle,
          data.bookAuthor,
          data.price
        );
        break;
      case "commissionPaymentRequest":
        emailContent = emailTemplates.commissionPaymentRequest(
          data.userName,
          data.bookTitle,
          data.bookPrice,
          data.commissionAmount,
          data.role
        );
        break;
      case "commissionPaymentConfirmed":
        emailContent = emailTemplates.commissionPaymentConfirmed(
          data.userName,
          data.bookTitle,
          data.commissionAmount,
          data.role
        );
        break;
      default:
        throw new Error("Invalid email template");
    }

    const mailOptions = {
      from: `"BookLink" <${process.env.EMAIL_FROM || 'noreply@booklink.com'}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(` Email sent to ${to}: ${info.messageId}`);
    
    // For development with Ethereal, show preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log(` Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(` Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Bulk email function
export const sendBulkEmails = async (recipients, template, data) => {
  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail(to, template, data))
  );
  
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  
  console.log(` Bulk email results: ${successful} sent, ${failed} failed`);
  
  return { successful, failed, results };
};

export default { sendEmail, sendBulkEmails };