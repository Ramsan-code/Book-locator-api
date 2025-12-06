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

const MONGODB_URI = process.env.MONGODB_URI;

async function reproduceIssue() {
  console.log('Starting Reproduction Script...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find or Create Seller
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
    console.log('Seller:', seller._id);

    // 2. Find or Create Buyer
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
    console.log('Buyer:', buyer._id);

    // 3. Create Book for Seller
    const book = await Book.create({
      title: 'Reproduction Book',
      author: 'Test Author',
      price: 100,
      category: 'Fiction',
      condition: 'New',
      owner: seller._id,
      available: true,
      description: 'Test book',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    console.log('Book created:', book._id);

    // 4. Create Transaction (Buyer requests book)
    const transaction = await Transaction.create({
      book: book._id,
      buyer: buyer._id,
      seller: seller._id,
      price: book.price,
      status: 'pending'
    });
    console.log('Transaction created:', transaction._id);

    // 5. Simulate getIncomingRequests
    console.log('Simulating getIncomingRequests for seller:', seller._id);
    
    const transactions = await Transaction.find({
      seller: seller._id,
    })
      .populate("book", "title author price")
      .populate("buyer", "name email phone_no")

      .sort({ createdAt: -1 });

    console.log('Found transactions:', transactions.length);
    
    if (transactions.length > 0) {
        console.log('First transaction:', JSON.stringify(transactions[0], null, 2));
        if (transactions[0]._id.toString() === transaction._id.toString()) {
            console.log('SUCCESS: Transaction found!');
        } else {
            console.log('WARNING: Found different transaction.');
        }
    } else {
        console.log('FAILURE: No transactions found!');
    }

    // Cleanup
    await Transaction.findByIdAndDelete(transaction._id);
    await Book.findByIdAndDelete(book._id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

reproduceIssue();
