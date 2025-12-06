import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import {errorHandler,notFound} from "./src/middleware/errorHandler.js"
import adminRouter from "./src/routes/adminRouter.js"
import uploadRouter from "./src/routes/uploadRouter.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
connectDB();

import readerRouter from "./src/routes/readerRouter.js";
import bookRouter from "./src/routes/bookRouter.js";
import reviewRouter from "./src/routes/reviewRouter.js";
import transactionRouter from "./src/routes/transactionRouter.js";

app.get("/", (req, res) => {
  res.send("Hello Express!");
});

app.use("/api/readers", readerRouter);
app.use("/api/books", bookRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/admin",adminRouter);
app.use("/api/upload", uploadRouter);

// Static uploads removed in favor of Cloudinary
// const uploadsPath = path.join(__dirname, "uploads");
// app.use("/uploads", express.static(uploadsPath));
app.use(errorHandler)
app.use(notFound)




if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
