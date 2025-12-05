import express from "express";
import {
  getAllReviews,
  createReview,
  getReviewsByBook,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllReviews);
router.get("/:bookId", getReviewsByBook);

router.post("/:bookId", protect, createReview);
router.delete("/:id", protect, deleteReview);

export default router;
