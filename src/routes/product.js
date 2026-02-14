const express = require("express");
const productRouter = express.Router();
const bulkProducts = require("../utils/product");
const Product = require("../models/products");
const { errorResponse, successResponse } = require("../utils/response");
const uploadImage = require("../utils/upload");

productRouter.post("/addBulkProducts", async (req, res) => {
  try {
    const products = bulkProducts;

    // Upload images to Cloudinary + replace image field
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        // Upload image to cloudinary
        const cloudinaryUrl = await uploadImage(product.image);

        return {
          ...product,
          image: cloudinaryUrl, // replace local path
        };
      }),
    );

    // Insert all products in DB
    const insertedProducts = await Product.insertMany(updatedProducts);
    return successResponse(
      res,
      201,
      "Bulk products uploaded successfully",
      insertedProducts,
    );
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Something went wrong");
  }
});

productRouter.post("/getProducts", async (req, res) => {
  try {
    const {
      category,
      gender,
      popularity,
      sortPrice,
      page = 1,
      limit = 8,
      search,
    } = req.body;

    // BUILD FILTER QUERY
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category) query.category = category;

    if (gender) query.gender = gender;

    if (popularity) {
      query.tags = "trending";
    }

    // BUILD SORT OBJECT
    let sortOption = {};

    if (sortPrice === "high") {
      sortOption.price = -1;
    }

    if (sortPrice === "low") {
      sortOption.price = 1;
    }

    // PAGINATION CALCULATION
    const skip = (page - 1) * limit;

    // FETCH PRODUCTS
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // TOTAL COUNT (for pagination)
    const totalProducts = await Product.countDocuments(query);

    const totalPages = Math.ceil(totalProducts / limit);

    return successResponse(res, 200, "Products fetched successfully", {
      products,
      totalProducts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);

    return errorResponse(res, 500, "Something went wrong");
  }
});

module.exports = productRouter;
