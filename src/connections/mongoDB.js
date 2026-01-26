const mongoose = require("mongoose");

connectMongoDb = async (retries = 5) => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@thinklit.wqdf09e.mongodb.net/thinkIt?appName=ThinklIt`,
    );
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("Error connection MongoDB :", error?.message);
    if (retries === 0) {
      process.exit(1);
    }

    console.log("Retry after 3s, attempts left :", retries);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return connectMongoDb(retries - 1);
  }
};

module.exports = connectMongoDb;
