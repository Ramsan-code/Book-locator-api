import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "commission_pending", "commission_paid", "completed", "rejected"],
      default: "pending",
    },
    
    // Commission tracking
    commissionRate: {
      type: Number,
      default: 0.08, // 8%
    },
    commissionAmount: {
      type: Number,
      // Calculated as price * commissionRate
    },
    
    // Buyer commission payment
    buyerCommissionPaid: {
      type: Boolean,
      default: false,
    },
    buyerCommissionPaidAt: {
      type: Date,
    },
    buyerPaymentId: {
      type: String, // Razorpay/Stripe payment ID
    },
    
    // Seller commission payment
    sellerCommissionPaid: {
      type: Boolean,
      default: false,
    },
    sellerCommissionPaidAt: {
      type: Date,
    },
    sellerPaymentId: {
      type: String, // Razorpay/Stripe payment ID
    },
    
    // Contact info sharing
    contactInfoShared: {
      type: Boolean,
      default: false,
    },
    contactInfoSharedAt: {
      type: Date,
    },
    contactInfoSharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader", // Admin who shared the contact info
    },
  },
  { timestamps: true }
);

// Helper method to check if both commissions are paid
transactionSchema.methods.areBothCommissionsPaid = function() {
  return this.buyerCommissionPaid && this.sellerCommissionPaid;
};

// Helper method to calculate commission amount
transactionSchema.methods.calculateCommission = function() {
  return this.price * this.commissionRate;
};

// Pre-save hook to calculate commission amount
transactionSchema.pre('save', function(next) {
  if (this.isModified('price') || this.isModified('commissionRate')) {
    this.commissionAmount = this.calculateCommission();
  }
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;