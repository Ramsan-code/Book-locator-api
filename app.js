import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import {errorHandler,notFound} from "./middleware/errorHandler.js"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
connectDB();

import readerRouter from "./routes/readerRouter.js";
import bookRouter from "./routes/bookRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import transactionRouter from "./routes/transactionRouter.js";

app.use("/api/readers", readerRouter);
app.use("/api/books", bookRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/transactions", transactionRouter);
app.use(errorHandler)
app.use(notFound)

app.get("/", (req, res) => {
  res.send("Hello Express!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
