import Review from "../models/Review.js";
import Book from "../models/Book.js";
export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("reviewer", "name email")
      .populate("book", "title")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const existingReview = await Review.findOne({
      book: bookId,
      reviewer: req.user._id,
    });

    if (existingReview)
      return res
        .status(400)
        .json({ message: "You already reviewed this book" });

    const review = await Review.create({
      book: bookId,
      reviewer: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsByBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ book: bookId })
      .populate("reviewer", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.reviewer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await review.deleteOne();
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};
