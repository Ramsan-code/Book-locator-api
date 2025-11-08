import Reader from "../models/Reader.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
export const getAllReaders = async (req, res) => {
  try {
    const readers = await Reader.find().select("-password"); 
    res.status(200).json(readers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const registerReader = async (req, res, next) => {
  try {
    const { name, email, password, location } = req.body;

    const existing = await Reader.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const reader = await Reader.create({ name, email, password, location });
    const token = generateToken(reader._id);

    res.status(201).json({
      _id: reader._id,
      name: reader.name,
      email: reader.email,
      token,
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

    const token = generateToken(reader._id);

    res.json({
      _id: reader._id,
      name: reader.name,
      email: reader.email,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const reader = await Reader.findById(req.user.id).select("-password");
    if (!reader) return res.status(404).json({ message: "Reader not found" });
    res.json(reader);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const reader = await Reader.findById(req.user.id);
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    reader.name = req.body.name || reader.name;
    reader.email = req.body.email || reader.email;
    if (req.body.password) {
      reader.password = req.body.password;
    }
    if (req.body.location) {
      reader.location = req.body.location;
    }

    const updatedReader = await reader.save();
    res.json({
      _id: updatedReader._id,
      name: updatedReader.name,
      email: updatedReader.email,
    });
  } catch (error) {
    next(error);
  }
};
