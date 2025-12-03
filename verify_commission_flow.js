import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Reader from './src/models/Reader.js';
import Book from './src/models/Book.js';
import Transaction from './src/models/Transaction.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/book_locator';

async function verifyFlow() {
  console.log(' Starting Commission Flow Verification...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Setup Users and Book
    console.log('\n1 Setting up test data...');
    
    // Create Admin
    let admin = await Reader.findOne({ email: 'admin@test.com' });
    if (!admin) {
      admin = await Reader.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        isApproved: true
      });
    }
    console.log('   Admin ready:', admin._id);

    // Create Seller
    let seller = await Reader.findOne({ email: 'seller@test.com' });
    if (!seller) {
      seller = await Reader.create({
        name: 'Seller User',
        email: 'seller@test.com',
        password: 'password123',
        role: 'user',
        isApproved: true
      });
    }
    console.log('   Seller ready:', seller._id);

    // Create Buyer
    let buyer = await Reader.findOne({ email: 'buyer@test.com' });
    if (!buyer) {
      buyer = await Reader.create({
        name: 'Buyer User',
        email: 'buyer@test.com',
        password: 'password123',
        role: 'user',
        isApproved: true
      });
    }
    console.log('   Buyer ready:', buyer._id);

    // Create Book
    const book = await Book.create({
      title: 'Test Commission Book',
      author: 'Test Author',
      price: 100,
      category: 'Fiction',
      condition: 'New',
      owner: seller._id,
      available: true,
      description: 'Test book for commission flow',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    console.log('   Book created:', book._id);

    // 2. Create Transaction (Buyer requests book)
    console.log('\n2 Buyer requesting book...');
    const transaction = await Transaction.create({
      book: book._id,
      buyer: buyer._id,
      seller: seller._id,
      price: book.price,
      status: 'pending'
    });
    console.log('   Transaction created:', transaction._id);
    console.log('   Status:', transaction.status);

    // 3. Seller Accepts Request
    console.log('\n3 Seller accepting request...');
    transaction.status = 'accepted';
    // This logic is usually in the controller, so we simulate the controller logic here
    // In controller: if (status === 'accepted') -> status = 'commission_pending'
    transaction.status = 'commission_pending';
    transaction.commissionAmount = transaction.price * 0.08;
    await transaction.save();
    console.log('   Status updated to:', transaction.status);
    console.log('   Commission Amount:', transaction.commissionAmount);

    // 4. Buyer Pays Commission
    console.log('\n4️⃣ Buyer paying commission...');
    transaction.buyerCommissionPaid = true;
    transaction.buyerCommissionPaidAt = new Date();
    transaction.buyerPaymentId = 'pay_mock_buyer_123';
    await transaction.save();
    console.log('   Buyer commission paid:', transaction.buyerCommissionPaid);

    // 5. Seller Pays Commission
    console.log('\n5 Seller paying commission...');
    transaction.sellerCommissionPaid = true;
    transaction.sellerCommissionPaidAt = new Date();
    transaction.sellerPaymentId = 'pay_mock_seller_123';
    
    // Check if both paid
    if (transaction.buyerCommissionPaid && transaction.sellerCommissionPaid) {
      transaction.status = 'commission_paid';
      console.log('   Both commissions paid! Status updated to:', transaction.status);
    }
    await transaction.save();

    // 6. Admin Shares Contact Info
    console.log('\n6 Admin sharing contact info...');
    if (transaction.status === 'commission_paid') {
      transaction.contactInfoShared = true;
      transaction.contactInfoSharedAt = new Date();
      transaction.contactInfoSharedBy = admin._id;
      transaction.status = 'completed';
      await transaction.save();
      console.log('   Contact info shared! Status updated to:', transaction.status);
    } else {
      console.error(' Failed: Status is not commission_paid');
    }

    // 7. Verify Final State
    console.log('\n7 Verifying final state...');
    const finalTx = await Transaction.findById(transaction._id);
    console.log('   Final Status:', finalTx.status);
    console.log('   Buyer Paid:', finalTx.buyerCommissionPaid);
    console.log('   Seller Paid:', finalTx.sellerCommissionPaid);
    console.log('   Contact Shared:', finalTx.contactInfoShared);

    if (finalTx.status === 'completed' && finalTx.contactInfoShared) {
      console.log('\n SUCCESS: Commission flow verified successfully!');
    } else {
      console.log('\n FAILED: Final state incorrect');
    }

    // Cleanup
    console.log('\n Cleaning up test data...');
    await Transaction.findByIdAndDelete(transaction._id);
    await Book.findByIdAndDelete(book._id);
    // Keep users for future tests or delete if preferred
    // await Reader.deleteMany({ email: { $in: ['admin@test.com', 'seller@test.com', 'buyer@test.com'] } });
    console.log('   Cleanup done');

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

verifyFlow();
