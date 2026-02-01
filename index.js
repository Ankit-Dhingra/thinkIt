const express = require("express");
const authRouter = require("./src/routes/auth");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectMongoDb = require("./src/connections/mongoDB");
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

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
