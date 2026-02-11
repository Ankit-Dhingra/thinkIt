const express = require("express");
const authRouter = require("./src/routes/auth");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectMongoDb = require("./src/connections/mongoDB");
const { globalRateLimiter } = require("./src/middlewares/rateLimiter");
const requestLogger = require("./src/middlewares/requestLogger");
const { products } = require("./src/utils/product");
const productRouter = require("./src/routes/product");
const PORT = 5000;
connectMongoDb();

app.use(cors(
  {
    origin: 'http://localhost:5173',
    credentials: true,
  }
));
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(requestLogger); // Log all incoming requests
app.use(globalRateLimiter); // Apply global rate limiter to all routes

app.use("/auth", authRouter);
app.use("/products", productRouter);

app.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
