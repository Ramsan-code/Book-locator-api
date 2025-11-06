import express from "express";
import {
  getAllBooks,
  getBooksById,
  createBook,
  updateBook,
  deleteBook,
  getBooksByGenre,
} from "../controllers/bookController.js";

const router = express.Router();
router.get("/genre/:genre", getBooksByGenre);
router.get("/", getAllBooks);
router.get("/:id", getBooksById);
router.post("/", createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
