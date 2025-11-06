import express from "express";
import {
  registerReader,
  loginReader,
  getProfile,
  updateProfile,
  getAllReaders,
} from "../controllers/readerController.js";

const router = express.Router();
router.post("/register", registerReader);
router.post("/login", loginReader);
router.get("/", getAllReaders);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
