import Transaction from "../models/Transaction.js";
import Book from "../models/Book.js";
import { sendEmail } from "../services/emailService.js";

// UPDATED: Create transaction - only BUY, no rent
export const createTransaction = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    // REMOVED: type and rentDurationDays parameters

    const book = await Book.findById(bookId).populate("owner");
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (!book.available)
      return res.status(400).json({ message: "Book not available" });

    if (!book.owner)
      return res.status(400).json({ message: "Book has no valid owner" });

    if (book.owner._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: "Cannot buy your own book" });

    // Check if user has already requested this book
    const existingTransaction = await Transaction.findOne({
      book: bookId,
      buyer: req.user._id,
      status: { $in: ["pending", "accepted"] }
    });

    if (existingTransaction) {
      return res.status(400).json({ 
        message: "You have already requested this book. Check your transactions page." 
      });
    }


    const transaction = await Transaction.create({
      book: bookId,
      buyer: req.user._id,
      seller: book.owner._id,
      // REMOVED: type field
      // REMOVED: rentDurationDays field
      price: book.price,
    });

    book.available = false;
    await book.save();

    await transaction.populate([
      { path: "buyer", select: "name email" },
      { path: "book", select: "title" },
    ]);

    // Send notification email to seller
    await sendEmail(book.owner.email, "transactionCreated", {
      sellerName: book.owner.name,
      buyerName: transaction.buyer.name,
      bookTitle: transaction.book.title,
      transactionType: "Purchase", // CHANGED: Always purchase
      price: book.price,
    });

    res.status(201).json({
      message: "Transaction created successfully. Seller has been notified.",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    })
      .populate("book", "title author price")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      buyer: req.user._id,
    })
      .populate("book", "title author price owner")
      .populate("seller", "name email phone_no")
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

export const getIncomingRequests = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      seller: req.user._id,
    })
      .populate("book", "title author price")
      .populate("buyer", "name email phone_no")

      .sort({ createdAt: -1 });
    
    // Map buyer to requester for frontend compatibility if needed
    const formattedTransactions = transactions.map(t => {
      const obj = t.toObject();
      if (!obj.requester && obj.buyer) {
        obj.requester = obj.buyer;
      }
      return obj;
    });

    res.json({ success: true, transactions: formattedTransactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("book", "title author price")
      .populate("buyer", "name email")
      .populate("seller", "name email");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (
      transaction.buyer._id.toString() !== req.user._id.toString() &&
      transaction.seller._id.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: "Not authorized" });

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id)
      .populate("buyer", "name email phone_no address city")
      .populate("seller", "name email phone_no address city")
      .populate("book", "title author price");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (transaction.seller._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const oldStatus = transaction.status;
    transaction.status = status;
    await transaction.save();

    // When seller accepts, change status to commission_pending and notify both parties
    if (status === "accepted" && oldStatus === "pending") {
      transaction.status = "commission_pending";
      await transaction.save();

      // Send commission payment request emails to both parties
      const commissionAmount = transaction.commissionAmount;
      
      // Email to buyer
      await sendEmail(transaction.buyer.email, "commissionPaymentRequest", {
        userName: transaction.buyer.name,
        bookTitle: transaction.book.title,
        bookPrice: transaction.book.price,
        commissionAmount: commissionAmount,
        role: "buyer",
      });

      // Email to seller
      await sendEmail(transaction.seller.email, "commissionPaymentRequest", {
        userName: transaction.seller.name,
        bookTitle: transaction.book.title,
        bookPrice: transaction.book.price,
        commissionAmount: commissionAmount,
        role: "seller",
      });
    }

    if (status === "rejected") {
      const book = await Book.findById(transaction.book);
      book.available = true;
      await book.save();
    }

    res.json({
      message: "Transaction status updated successfully",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// Record commission payment from buyer or seller
export const recordCommissionPayment = async (req, res, next) => {
  try {
    const { paymentId, role } = req.body; // role: 'buyer' or 'seller'
    const transaction = await Transaction.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("book", "title");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    // Verify user is either buyer or seller
    const isBuyer = transaction.buyer._id.toString() === req.user._id.toString();
    const isSeller = transaction.seller._id.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: "Not authorized" });

    // Record payment based on role
    if (role === "buyer" && isBuyer) {
      if (transaction.buyerCommissionPaid) {
        return res.status(400).json({ message: "Buyer commission already paid" });
      }
      transaction.buyerCommissionPaid = true;
      transaction.buyerCommissionPaidAt = new Date();
      transaction.buyerPaymentId = paymentId;
    } else if (role === "seller" && isSeller) {
      if (transaction.sellerCommissionPaid) {
        return res.status(400).json({ message: "Seller commission already paid" });
      }
      transaction.sellerCommissionPaid = true;
      transaction.sellerCommissionPaidAt = new Date();
      transaction.sellerPaymentId = paymentId;
    } else {
      return res.status(400).json({ message: "Invalid role or unauthorized" });
    }

    // Check if both have paid
    if (transaction.areBothCommissionsPaid()) {
      transaction.status = "commission_paid";
      
      // Notify admin that both commissions are paid
      // TODO: Send notification to admin
    }

    await transaction.save();

    // Send confirmation email
    const userEmail = role === "buyer" ? transaction.buyer.email : transaction.seller.email;
    const userName = role === "buyer" ? transaction.buyer.name : transaction.seller.name;
    
    await sendEmail(userEmail, "commissionPaymentConfirmed", {
      userName: userName,
      bookTitle: transaction.book.title,
      commissionAmount: transaction.commissionAmount,
      role: role,
    });

    res.json({
      message: "Commission payment recorded successfully",
      transaction,
      bothPaid: transaction.areBothCommissionsPaid(),
    });
  } catch (error) {
    next(error);
  }
};

// Admin shares contact information after both commissions are paid
export const shareContactInfo = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("buyer", "name email phone_no address city")
      .populate("seller", "name email phone_no address city")
      .populate("book", "title author price");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    // Check if user is admin
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can share contact info" });

    // Check if both commissions are paid
    if (!transaction.areBothCommissionsPaid()) {
      return res.status(400).json({ 
        message: "Cannot share contact info until both parties have paid commission",
        buyerPaid: transaction.buyerCommissionPaid,
        sellerPaid: transaction.sellerCommissionPaid,
      });
    }

    // Check if already shared
    if (transaction.contactInfoShared) {
      return res.status(400).json({ message: "Contact info already shared" });
    }

    // Send emails with contact information
    // Email to buyer with seller's contact info
    await sendEmail(transaction.buyer.email, "requestAccepted", {
      buyerName: transaction.buyer.name,
      sellerName: transaction.seller.name,
      sellerEmail: transaction.seller.email,
      sellerPhone: transaction.seller.phone_no || "Not provided",
      sellerAddress: transaction.seller.address || transaction.seller.city || "Not provided",
      bookTitle: transaction.book.title,
      bookAuthor: transaction.book.author,
      price: transaction.book.price,
    });

    // Email to seller with buyer's contact info
    await sendEmail(transaction.seller.email, "requestAcceptedSeller", {
      sellerName: transaction.seller.name,
      buyerName: transaction.buyer.name,
      buyerEmail: transaction.buyer.email,
      buyerPhone: transaction.buyer.phone_no || "Not provided",
      buyerAddress: transaction.buyer.address || transaction.buyer.city || "Not provided",
      bookTitle: transaction.book.title,
      bookAuthor: transaction.book.author,
      price: transaction.book.price,
    });

    // Update transaction
    transaction.contactInfoShared = true;
    transaction.contactInfoSharedAt = new Date();
    transaction.contactInfoSharedBy = req.user._id;
    transaction.status = "completed";
    await transaction.save();

    res.json({
      message: "Contact information shared successfully",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// Get transactions pending commission payments (for admin dashboard)
export const getPendingCommissions = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can access this" });

    const transactions = await Transaction.find({
      status: { $in: ["commission_pending", "commission_paid"] },
    })
      .populate("book", "title author price")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};