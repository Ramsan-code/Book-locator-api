import Transaction from "../models/Transaction.js";
import Book from "../models/Book.js";
import { sendEmail } from "../services/emailService.js";

//  UPDATED: Create transaction with email notification to seller
export const createTransaction = async (req, res, next) => {
  try {
    const { bookId, type, rentDurationDays } = req.body;

    const book = await Book.findById(bookId).populate("owner");
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (!book.available)
      return res.status(400).json({ message: "Book not available" });

    if (book.owner._id.toString() === req.user.id)
      return res.status(400).json({ message: "Cannot buy/rent your own book" });

    const transaction = await Transaction.create({
      book: bookId,
      buyer: req.user.id,
      seller: book.owner._id,
      type,
      rentDurationDays: type === "Rent" ? rentDurationDays : undefined,
      price: book.price,
    });

    book.available = false;
    await book.save();

    // Populate transaction for email
    await transaction.populate([
      { path: "buyer", select: "name email" },
      { path: "book", select: "title" },
    ]);

    // 📧 Send notification email to seller
    await sendEmail(book.owner.email, "transactionCreated", {
      sellerName: book.owner.name,
      buyerName: transaction.buyer.name,
      bookTitle: transaction.book.title,
      transactionType: type,
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
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
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

export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("book", "title author price")
      .populate("buyer", "name email")
      .populate("seller", "name email");

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (
      transaction.buyer._id.toString() !== req.user.id &&
      transaction.seller._id.toString() !== req.user.id
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
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (transaction.seller.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    transaction.status = status;
    await transaction.save();

    if (status === "Completed") {
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