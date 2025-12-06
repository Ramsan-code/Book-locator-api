import mongoose from "mongoose";
import dotenv from "dotenv";
import Reader from "../src/models/Reader.js";
import connectDB from "../src/config/db.js";

dotenv.config();

// Admin seed data
const adminUsers = [
  {
    name: "Super Admin",
    email: "admin@booklocator.com",
    password: "Admin@123456", // Will be hashed automatically by the model
    role: "admin",
    isApproved: true,
    location: {
      type: "Point",
      coordinates: [0, 0], // Default location
    },
    bio: "System Administrator",
  },
];

const seedAdmins = async () => {
  try {
    await connectDB();

    console.log(" Starting admin seeding...");

    // Check if admins already exist
    for (const adminData of adminUsers) {
      const existingAdmin = await Reader.findOne({ email: adminData.email });

      if (existingAdmin) {
        console.log(`Admin already exists: ${adminData.email}`);
        continue;
      }

      // Create new admin
      const admin = await Reader.create(adminData);
      console.log(` Admin created: ${admin.email} (${admin.role})`);
    }

    console.log("\n Admin seeding completed!");
    console.log("\n Login Credentials:");
    console.log("================================");
    adminUsers.forEach((admin) => {
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${admin.password}`);
      console.log(`Role: ${admin.role}`);
      console.log("--------------------------------");
    });

    process.exit(0);
  } catch (error) {
    console.error(" Error seeding admins:", error);
    process.exit(1);
  }
};

// Run the seed function
seedAdmins();