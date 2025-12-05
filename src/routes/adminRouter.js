import express from "express";
import { protect } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminAuth.js";
import {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getPendingUsers,
  approveUser,
  toggleUserStatus,
  deleteUser,
  
  // Book Management
  getAllBooksAdmin,
  getPendingBooks,
  approveBook,
  rejectBook,
  toggleFeaturedBook,
  deleteBookAdmin,
  getOwnerDetails,
  
  // Transaction Management
  getAllTransactions,
  
  // Review Management
  getAllReviews,
  deleteReviewAdmin,

  // Settings Management
  getSettings,
  updateSettings,
  getPublicSettings,
} from "../controllers/adminController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/settings/public", getPublicSettings);

// All other routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// ==================== DASHBOARD ====================
router.get("/dashboard/stats", getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get("/users", getAllUsers);
router.get("/users/pending", getPendingUsers);
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// ==================== BOOK MANAGEMENT ====================
router.get("/books", getAllBooksAdmin);
router.get("/books/pending", getPendingBooks);
router.get("/books/owner/:ownerId", getOwnerDetails);
router.put("/books/:id/approve", approveBook);
router.put("/books/:id/reject", rejectBook);
router.put("/books/:id/toggle-featured", toggleFeaturedBook);
router.delete("/books/:id", deleteBookAdmin);

// ==================== TRANSACTION MANAGEMENT ====================
router.get("/transactions", getAllTransactions);

// ==================== REVIEW MANAGEMENT ====================
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReviewAdmin);

// ==================== SETTINGS MANAGEMENT ====================
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;