import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const readerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    //  Role field - SIMPLIFIED: Only user and admin
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    //  Approval status
    isApproved: {
      type: Boolean,
      default: false, // Users need approval by default
    },
    //  Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Approval details
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
    },
    approvedAt: {
      type: Date,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    bio: String,
    avatar: String,
    // Additional Profile Fields
    address: String,
    city: String,
    phone_no: String,
    image: String, // URL to profile image
    // Track last login
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
readerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
readerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//  Check if user is admin
readerSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Index for geospatial queries
readerSchema.index({ location: "2dsphere" });

// Index for faster role queries
readerSchema.index({ role: 1 });
readerSchema.index({ isApproved: 1 });

const Reader = mongoose.model("Reader", readerSchema);
export default Reader;