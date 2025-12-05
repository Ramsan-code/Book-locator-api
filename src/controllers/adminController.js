import Reader from "../models/Reader.js";
import Book from "../models/Book.js";
import Transaction from "../models/Transaction.js";
import Review from "../models/Review.js";
import Setting from "../models/Setting.js";
import { AppError } from "../middleware/errorHandler.js";
import { paginationResponse } from "../utils/paginate.js";

// ==================== DASHBOARD STATISTICS ====================

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBooks,
      totalTransactions,
      totalRevenue,
      pendingApprovals,
      activeUsers,
    ] = await Promise.all([
      Reader.countDocuments(),
      Book.countDocuments(),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
      Reader.countDocuments({ isApproved: false, role: "user" }),
      Reader.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBooks,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingApprovals,
        activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users with filters
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isApproved, isActive, search } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await Reader.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Reader.countDocuments(filter);
    const response = paginationResponse(users, parseInt(page), parseInt(limit), total);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get pending user approvals
export const getPendingUsers = async (req, res, next) => {
  try {
    const users = await Reader.find({
      isApproved: false,
      role: "user",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Approve user
export const approveUser = async (req, res, next) => {
  try {
    const user = await Reader.findById(req.params.id);
    
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isApproved) {
      return next(new AppError("User is already approved", 400));
    }

    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User approved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate/Activate user
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await Reader.findById(req.params.id);
    
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Prevent deactivating admins
    if (user.role === "admin") {
      return next(new AppError("Cannot deactivate admin users", 403));
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    const user = await Reader.findById(req.params.id);
    
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Prevent deleting admins
    if (user.role === "admin") {
      return next(new AppError("Cannot delete admin users", 403));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BOOK MANAGEMENT ====================

// Get all books (including unapproved)
export const getAllBooksAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, approvalStatus, search } = req.query;
    
    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const books = await Book.find(filter)
      .populate("owner", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(filter);
    const response = paginationResponse(books, parseInt(page), parseInt(limit), total);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get pending book approvals
export const getPendingBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ approvalStatus: "pending" })
      .populate("owner", "name email bio avatar createdAt location")
      .sort({ createdAt: -1 });

    // Enhance with owner statistics
    const booksWithStats = await Promise.all(
      books.map(async (book) => {
        const bookObj = book.toObject();
        
        if (bookObj.owner) {
          // Get owner's book statistics
          const [totalBooks, approvedBooks, avgRating] = await Promise.all([
            Book.countDocuments({ owner: bookObj.owner._id }),
            Book.countDocuments({ owner: bookObj.owner._id, approvalStatus: "approved" }),
            Review.aggregate([
              {
                $lookup: {
                  from: "books",
                  localField: "book",
                  foreignField: "_id",
                  as: "bookDetails"
                }
              },
              { $unwind: "$bookDetails" },
              { $match: { "bookDetails.owner": bookObj.owner._id } },
              {
                $group: {
                  _id: null,
                  avgRating: { $avg: "$rating" },
                  totalReviews: { $sum: 1 }
                }
              }
            ])
          ]);

          bookObj.owner.stats = {
            totalBooks,
            approvedBooks,
            averageRating: avgRating[0]?.avgRating || 0,
            totalReviews: avgRating[0]?.totalReviews || 0
          };
        }

        return bookObj;
      })
    );

    res.status(200).json({
      success: true,
      count: booksWithStats.length,
      data: booksWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// Approve book
export const approveBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    if (book.approvalStatus === "approved") {
      return next(new AppError("Book is already approved", 400));
    }

    book.isApproved = true;
    book.approvalStatus = "approved";
    book.approvedBy = req.user._id;
    book.approvedAt = new Date();
    await book.save();

    res.status(200).json({
      success: true,
      message: "Book approved successfully",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// Reject book
export const rejectBook = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    book.isApproved = false;
    book.approvalStatus = "rejected";
    book.rejectionReason = reason || "Does not meet quality standards";
    await book.save();

    res.status(200).json({
      success: true,
      message: "Book rejected",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle featured status
export const toggleFeaturedBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    book.isFeatured = !book.isFeatured;
    await book.save();

    res.status(200).json({
      success: true,
      message: `Book ${book.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// Delete book
export const deleteBookAdmin = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed owner information for admin review
export const getOwnerDetails = async (req, res, next) => {
  try {
    const { ownerId } = req.params;

    // Get owner profile
    const owner = await Reader.findById(ownerId).select("-password");
    
    if (!owner) {
      return next(new AppError("Owner not found", 404));
    }

    // Get owner's all books with approval status
    const books = await Book.find({ owner: ownerId })
      .select("title author category price approvalStatus isApproved createdAt image")
      .sort({ createdAt: -1 });

    // Get owner's reviews (reviews on their books)
    const reviews = await Review.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "book",
          foreignField: "_id",
          as: "bookDetails"
        }
      },
      { $unwind: "$bookDetails" },
      { $match: { "bookDetails.owner": owner._id } },
      {
        $lookup: {
          from: "readers",
          localField: "reviewer",
          foreignField: "_id",
          as: "reviewerDetails"
        }
      },
      { $unwind: "$reviewerDetails" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          "reviewer.name": "$reviewerDetails.name",
          "reviewer.avatar": "$reviewerDetails.avatar",
          "book.title": "$bookDetails.title"
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);

    // Get transaction statistics
    const [sellerTransactions, buyerTransactions] = await Promise.all([
      Transaction.countDocuments({ seller: ownerId }),
      Transaction.countDocuments({ buyer: ownerId })
    ]);

    // Calculate statistics
    const stats = {
      totalBooks: books.length,
      approvedBooks: books.filter(b => b.approvalStatus === "approved").length,
      pendingBooks: books.filter(b => b.approvalStatus === "pending").length,
      rejectedBooks: books.filter(b => b.approvalStatus === "rejected").length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0,
      totalReviews: reviews.length,
      totalSales: sellerTransactions,
      totalPurchases: buyerTransactions
    };

    res.status(200).json({
      success: true,
      data: {
        owner,
        books,
        reviews,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TRANSACTION MANAGEMENT ====================

export const getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await Transaction.find(filter)
      .populate("book", "title author price")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(filter);
    const response = paginationResponse(transactions, parseInt(page), parseInt(limit), total);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// ==================== REVIEW MANAGEMENT ====================

export const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find()
      .populate("book", "title")
      .populate("reviewer", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments();
    const response = paginationResponse(reviews, parseInt(page), parseInt(limit), total);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteReviewAdmin = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return next(new AppError("Review not found", 404));
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SETTINGS MANAGEMENT ====================

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.find().sort({ key: 1 });

    // Initialize default settings if none exist
    if (settings.length === 0) {
      const defaultSettings = [
        {
          key: "commission_rate",
          value: 0.08,
          description: "Commission rate for transactions (e.g., 0.08 for 8%)",
          type: "number",
        },
        {
          key: "site_name",
          value: "Book Locator",
          description: "Name of the application",
          type: "string",
        },
        {
          key: "support_email",
          value: "support@booklocator.com",
          description: "Support email address",
          type: "string",
        },
        {
          key: "featured_listings_limit",
          value: 4,
          description: "Number of books to display in Featured Listings section",
          type: "number",
        },
        {
          key: "new_arrivals_limit",
          value: 4,
          description: "Number of books to display in New Arrivals section",
          type: "number",
        },
      ];

      settings = await Setting.insertMany(defaultSettings);
    }

    // Ensure critical settings exist even if other settings exist
    const criticalSettings = [
      {
        key: "commission_rate",
        value: 0.08,
        description: "Commission rate for transactions (e.g., 0.08 for 8%)",
        type: "number",
      },
      {
        key: "featured_listings_limit",
        value: 4,
        description: "Number of books to display in Featured Listings section",
        type: "number",
      },
      {
        key: "new_arrivals_limit",
        value: 4,
        description: "Number of books to display in New Arrivals section",
        type: "number",
      },
    ];

    for (const criticalSetting of criticalSettings) {
      const exists = settings.find((s) => s.key === criticalSetting.key);
      if (!exists) {
        const newSetting = await Setting.create(criticalSetting);
        settings.push(newSetting);
      }
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return next(new AppError("Settings must be an array", 400));
    }

    const updatedSettings = [];

    for (const setting of settings) {
      const { key, value } = setting;
      
      const updatedSetting = await Setting.findOneAndUpdate(
        { key },
        { value },
        { new: true, runValidators: true }
      );

      if (updatedSetting) {
        updatedSettings.push(updatedSetting);
      }
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

// Get public settings (no authentication required)
export const getPublicSettings = async (req, res, next) => {
  try {
    // Fetch only public-facing settings
    const publicKeys = ['featured_listings_limit', 'new_arrivals_limit', 'site_name'];
    const settings = await Setting.find({ key: { $in: publicKeys } });

    // Return as key-value object for easier frontend consumption
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Provide defaults if settings don't exist
    const defaults = {
      featured_listings_limit: 4,
      new_arrivals_limit: 4,
      site_name: 'Book Locator'
    };

    res.status(200).json({
      success: true,
      data: { ...defaults, ...settingsObj }
    });
  } catch (error) {
    next(error);
  }
};