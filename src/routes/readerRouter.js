import express from "express";
import { protect } from "../middleware/auth.js";
import { logoutReader } from "../controllers/readerController.js";

import {
  registerReader,
  loginReader,
  getProfile,
  updateProfile,
  getAllReaders,
  getReaderById,
  changePassword,
  deleteAccount,
} from "../controllers/readerController.js";

const router = express.Router();
router.post("/register", registerReader);
router.post("/login", loginReader);
router.get("/", getAllReaders);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);
router.post("/logout", protect, logoutReader);

// This must come AFTER /profile to avoid capturing "profile" as an ID
router.get("/:id", getReaderById);

export default router;
