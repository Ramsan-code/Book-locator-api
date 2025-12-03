import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createTransaction,
  getUserTransactions,
  getMyRequests,
  getIncomingRequests,
  getTransactionById,
  updateTransactionStatus,
  recordCommissionPayment,
  shareContactInfo,
  getPendingCommissions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", protect, createTransaction);
router.get("/", protect, getUserTransactions);
router.get("/my-transactions", protect, getMyRequests);
router.get("/incoming-requests", protect, getIncomingRequests);
router.get("/pending-commissions", protect, getPendingCommissions);
router.get("/:id", protect, getTransactionById);
router.put("/:id/status", protect, updateTransactionStatus);
router.post("/:id/pay-commission", protect, recordCommissionPayment);
router.post("/:id/share-contact", protect, shareContactInfo);

export default router;
