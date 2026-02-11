const express = require("express");
const productRouter = express.Router();
const bulkProducts = require("../utils/product");
const { errorResponse } = require("../utils/response");

productRouter.post("/addBulkProducts", async (req, res) => {
  try {
    const products = bulkProducts;
    console.log(products);

    for (let i = 0; i < products.length; i++) {
      try {
        // const product = new Product(products[i]);
        // await product.save();
      } catch (error) {
        console.log(error);
        return errorResponse(res, 500, "Something went wrong");
      }
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Something went wrong");
  }
});

module.exports = productRouter;
