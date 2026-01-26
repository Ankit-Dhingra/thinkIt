const express = require("express");
const userModel = require("../models/user");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { generateAccessAndRefreshToken } = require("../utils/token");
const { cookieOptions } = require("../utils/constant");

authRouter.get("/health", (req, res) => {
  res.send("okay");
});

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobile } = req.body;
    if (!firstName || !lastName || !email || !password || !mobile) {
      return errorResponse(res, 400, "Please fill all the required fields");
    }
    const existUser = await userModel.findOne({
      $or: [{ email }, { mobile }],
    });
    if (existUser) return errorResponse(res, 409, "User Already Exists");

    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password,
      mobile,
    });

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(res, 201, "User Created Successfully");
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorResponse(res, 400, "Please fill complete details");

    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    // Sign JWT
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(res, 200, "Logged in Successfully");
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
});

authRouter.post("/refresh-token", async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken)
      return errorResponse(res, 401, "refresh token missing");

    const decode = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );

    const user = await userModel.findById(decode.id);

    if (!user) return errorResponse(res, 401, "Unauthorized");

    if (incomingRefreshToken !== user?.refreshToken)
      return errorResponse(
        res,
        404,
        "Invalid refresh token or token already used",
      );

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(res, 200, "token refreshed successfully");
  } catch (error) {
    console.log("error in refresh token : ", error);
    return errorResponse(res, 401, "Invalid or expired refresh token");
  }
});

authRouter.post("/logout", authMiddleware, async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.user._id, {
      $set: { refreshToken: null },
    });

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return successResponse(res, 200, "user logout successfully");
  } catch (error) {
    console.log("Error in logout api : ", error);
    return errorResponse(res, 500, "someting went wrong");
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  return successResponse(res, 200, "User fetched successfully", req.user);
});

module.exports = authRouter;
