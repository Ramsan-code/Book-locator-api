import Book from "../models/Book.js";
import { paginationResponse } from "../utils/paginate.js";


//<----------Get all books from the database------------>
export const getAllBooks = async (req, res) => {
  try {
    //<----------------Add pagination to get all books endpoint-------------->
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find().skip(skip).limit(limit);
    const totalBooks = await Book.countDocuments();
     const response = paginationResponse(books, page, limit, totalBooks);
    // const books = await Book.find()//<--------?page=1&limit=2------->
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//<---------------Get a single book by ID----------->
export const getBooksById = async (req, res) => {
  try {
    const bookID = req.params.id;
    const book = await Book.findById(bookID);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//<-------------Add a new book to the database -------->
export const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(200).json(book);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.title) {
      return res
        .status(400)
        .json({ errors: [{ field: "title", message: "title already taken" }] });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({ errors });
    }
    res.status(400).json({ message: error.message });
  }
};

//<---------------Update a book information--------->
export const updateBook = async (req, res) => {
  try {
    const bookID = req.params.id;
    const updateData = req.body;
    const updateBook = await Book.findByIdAndUpdate(bookID, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updateBook) {
      return res.status(404).json({ message: error.message });
    }
    res.json(updateBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//<---------------Delete a book from the database----->

export const deleteBook = async (req, res) => {
  try {
    const bookID = req.params.id;
    const deleteBook = await Book.findByIdAndDelete(bookID);
    if (!deleteBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "deleted Book" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//<---------------Add a search endpoint by genre------------->
export const getBooksByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    if (!genre) {
      return res.status(400).json({ message: "Genre is required" });
    }
    const books = await Book.find({
      genre: { $regex: new RegExp(genre, "i") },
    });
    if (books.length === 0) {
      return res.status(404).json({ message: ` genre invalid: ${genre}` });
    }
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
