import Reader from "../models/Reader.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../services/emailService.js";

export const getAllReaders = async (req, res) => {
  try {
    const readers = await Reader.find().select("-password"); 
    res.status(200).json(readers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  UPDATED: Register with welcome email
export const registerReader = async (req, res, next) => {
  try {
    const { name, email, password, location } = req.body;

    const existing = await Reader.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const reader = await Reader.create({ name, email, password, location });
    const token = generateToken(reader._id);

    // 📧 Send welcome email
    await sendEmail(email, "welcomeEmail", {
      userName: name,
      userEmail: email,
    });

    res.status(201).json({
      _id: reader._id,
      name: reader.name,
      email: reader.email,
      role: reader.role,
      isApproved: reader.isApproved,
      token,
      message: "Registration successful! Please wait for admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

export const loginReader = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const reader = await Reader.findOne({ email }).select("+password");
    if (!reader)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, reader.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Check if user is approved (only for regular users, not admins)
    if (reader.role !== "admin" && !reader.isApproved) {
      return res.status(403).json({ 
        message: "Your account is pending admin approval. Please wait for approval before logging in.",
        isApproved: false 
      });
    }

    // Update last login
    reader.lastLogin = new Date();
    await reader.save();

    const token = generateToken(reader._id);

    res.json({
      _id: reader._id,
      name: reader.name,
      email: reader.email,
      role: reader.role,
      isApproved: reader.isApproved,
      isActive: reader.isActive,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    console.log("[ReaderController] getProfile called");
    console.log("[ReaderController] req.user:", req.user);
    if (!req.user) {
       console.error("[ReaderController] req.user is missing!");
       return res.status(500).json({ message: "Server Error: User not attached to request" });
    }
    const reader = await Reader.findById(req.user._id).select("-password");
    if (!reader) return res.status(404).json({ message: "Reader not found" });
    res.json(reader);
  } catch (error) {
    console.error("[ReaderController] getProfile error:", error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const reader = await Reader.findById(req.user._id);
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    reader.name = req.body.name || reader.name;
    reader.email = req.body.email || reader.email;
    reader.address = req.body.address || reader.address;
    reader.city = req.body.city || reader.city;
    reader.phone_no = req.body.phone_no || reader.phone_no;
    
    if (req.body.password) {
      reader.password = req.body.password;
    }
    if (req.body.location) {
      reader.location = req.body.location;
    }
    if (req.body.image !== undefined) {
      reader.image = req.body.image;
    }

    const updatedReader = await reader.save();
    res.json({
      _id: updatedReader._id,
      name: updatedReader.name,
      email: updatedReader.email,
      address: updatedReader.address,
      city: updatedReader.city,
      phone_no: updatedReader.phone_no,
      image: updatedReader.image,
      role: updatedReader.role,
      isApproved: updatedReader.isApproved,
    });
  } catch (error) {
    next(error);
  }
};
export const logoutReader = async (req, res, next) => {
  try {
    // Optional: Update last logout time in database
    if (req.user) {
      await Reader.findByIdAndUpdate(req.user._id, {
        lastLogout: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const reader = await Reader.findById(req.user._id).select("+password");
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    const isMatch = await reader.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    reader.password = newPassword;
    await reader.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const reader = await Reader.findById(req.user._id);
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    await Reader.deleteOne({ _id: reader._id });
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};