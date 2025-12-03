import jwt from "jsonwebtoken";
import Reader from "../models/Reader.js";

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("[AuthMiddleware] Token found:", token.substring(0, 10) + "...");

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yoursecret");
      console.log("[AuthMiddleware] Decoded:", decoded);

      req.user = await Reader.findById(decoded.id).select("-password");
      if (!req.user) {
        console.log("[AuthMiddleware] User not found for ID:", decoded.id);
        throw new Error("User not found");
      }
      console.log("[AuthMiddleware] User found:", req.user._id);

      next();
    } catch (error) {
      console.error("[AuthMiddleware] Error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("[AuthMiddleware] No token provided");
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
