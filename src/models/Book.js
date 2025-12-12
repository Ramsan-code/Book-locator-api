import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
    },
    category: {
      type: String,
      enum: ["Fiction", "Non-fiction", "Education", "Comics", "Sci-Fi", "Mystery", "Fantasy", "Romance", "Thriller", "Biography", "Self-Help", "History", "Other"],
      default: "Other",
    },
    condition: {
      type: String,
      enum: ["New", "Good", "Used", "Bad", "Damaged", "Other"],
      default: "Used",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    // REMOVED: mode field (Sell/Rent)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },
    image: String,
    description: String,
    available: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

bookSchema.index({ location: "2dsphere" });
bookSchema.index({ isApproved: 1 });
bookSchema.index({ approvalStatus: 1 });
bookSchema.index({ isFeatured: 1 });

const Book = mongoose.model("Book", bookSchema);
export default Book;