import Book from "../models/Book.js";
import { paginationResponse } from "../utils/paginate.js";

/**
 * Get all books with advanced search and filters
 */
export const getAllBooks = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      // REMOVED: mode parameter
      minPrice,
      maxPrice,
      available,
      isApproved,
      isFeatured,
      owner,
      sort,
      page = 1,
      limit = 10,
      lat,
      lng,
      radius,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (condition) {
      query.condition = condition;
    }

    // REMOVED: mode filter

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (available !== undefined) {
      query.available = available === "true";
    }

    if (isApproved !== undefined) {
      if (isApproved !== "all") {
        query.isApproved = isApproved === "true";
      }
      // If "all", we don't add isApproved to query, so it returns both
    } else {
      query.isApproved = true;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true";
    }

    if (owner) {
      query.owner = owner;
    }

    if (lat && lng && radius) {
      const radiusInRadians = parseFloat(radius) / 6378.1;
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
        },
      };
    }

    let sortQuery = { createdAt: -1 };
    if (sort) {
      sortQuery = {};
      const sortFields = sort.split(",");
      sortFields.forEach((field) => {
        if (field.startsWith("-")) {
          sortQuery[field.substring(1)] = -1;
        } else {
          sortQuery[field] = 1;
        }
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find(query)
      .populate("owner", "name email location city")
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await Book.countDocuments(query);
    
    // Transform books to include latitude and longitude
    const transformedBooks = books.map(book => {
      const bookObj = book.toObject();
      if (bookObj.location && bookObj.location.coordinates) {
        bookObj.longitude = bookObj.location.coordinates[0];
        bookObj.latitude = bookObj.location.coordinates[1];
      }
      return bookObj;
    });
    
    const response = paginationResponse(transformedBooks, pageNum, limitNum, total);

    response.filters = {
      search,
      category,
      condition,
      // REMOVED: mode from filters
      priceRange: minPrice || maxPrice ? { minPrice, maxPrice } : null,
      location: lat && lng && radius ? { lat, lng, radius } : null,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBooksNearLocation = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const books = await Book.find({
      isApproved: true,
      available: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate("owner", "name email city")
      .limit(20);

    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find({
      isFeatured: true,
      isApproved: true,
      available: true,
    })
      .populate("owner", "name email city")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Book.countDocuments({
      isFeatured: true,
      isApproved: true,
    });

    const response = paginationResponse(books, pageNum, limitNum, total);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // REMOVED: mode parameter

    const query = {
      available: true,
      isApproved: true,
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find(query)
      .populate("owner", "name email location city")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Book.countDocuments(query);
    const response = paginationResponse(books, pageNum, limitNum, total);

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const advancedSearch = async (req, res) => {
  try {
    const {
      q,
      categories,
      conditions,
      // REMOVED: modes parameter
      minPrice,
      maxPrice,
      sortBy = "relevance",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isApproved: true };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (categories) {
      const categoryList = categories.split(",");
      query.category = { $in: categoryList };
    }

    if (conditions) {
      const conditionList = conditions.split(",");
      query.condition = { $in: conditionList };
    }

    // REMOVED: modes filter

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortQuery = { createdAt: -1 };
    switch (sortBy) {
      case "price-asc":
        sortQuery = { price: 1 };
        break;
      case "price-desc":
        sortQuery = { price: -1 };
        break;
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "oldest":
        sortQuery = { createdAt: 1 };
        break;
      case "title":
        sortQuery = { title: 1 };
        break;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find(query)
      .populate("owner", "name email city")
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await Book.countDocuments(query);
    const response = paginationResponse(books, pageNum, limitNum, total);

    response.searchQuery = q;
    response.appliedFilters = {
      categories: categories?.split(","),
      conditions: conditions?.split(","),
      // REMOVED: modes from filters
      priceRange: { minPrice, maxPrice },
      sortBy,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, sort, minPrice, maxPrice } = req.query;

    const query = {
      category: { $regex: new RegExp(category, "i") },
      isApproved: true,
    };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortQuery = { createdAt: -1 };
    if (sort) {
      sortQuery = sort.startsWith("-")
        ? { [sort.substring(1)]: -1 }
        : { [sort]: 1 };
    }

    const books = await Book.find(query)
      .populate("owner", "name email city")
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await Book.countDocuments(query);

    if (books.length === 0) {
      return res.status(404).json({
        message: `No books found in category: ${category}`,
      });
    }

    const response = paginationResponse(books, pageNum, limitNum, total);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBooksById = async (req, res) => {
  try {
    const bookID = req.params.id;
    const book = await Book.findById(bookID).populate("owner", "name email location city");
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.views = (book.views || 0) + 1;
    await book.save();

    // Transform book to include latitude and longitude
    const bookObj = book.toObject();
    if (bookObj.location && bookObj.location.coordinates) {
      bookObj.longitude = bookObj.location.coordinates[0];
      bookObj.latitude = bookObj.location.coordinates[1];
    }

    res.json(bookObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
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

export const updateBook = async (req, res) => {
  try {
    const bookID = req.params.id;
    const updateData = req.body;
    const updateBook = await Book.findByIdAndUpdate(bookID, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updateBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(updateBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const bookID = req.params.id;
    const deleteBook = await Book.findByIdAndDelete(bookID);
    if (!deleteBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBooksByGenre = getBooksByCategory;