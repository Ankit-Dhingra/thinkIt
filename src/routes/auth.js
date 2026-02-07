const express = require("express");
const userModel = require("../models/user");
const otpModel = require("../models/otp");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utils/response");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { generateAccessAndRefreshToken } = require("../utils/token");
const { cookieOptions } = require("../utils/constant");
const { generateOTP, generateOtpHash } = require("../utils/generateOTP");
const { loginRateLimiter, otpLimiter } = require("../middlewares/rateLimiter");

authRouter.get("/health", (req, res) => {
  res.send("okay");
});

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, mobile } =
      req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !mobile
    ) {
      return errorResponse(res, 400, "Please fill all the required fields");
    }
    if (password !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match");
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

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(res, 201, "User Created Successfully", {
      user: userObj,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
});

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorResponse(res, 400, "Please fill complete details");

    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    // Sign JWT
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(res, 200, "Logged in Successfully", {
      user: userObj,
    });
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

authRouter.post("/request-otp", otpLimiter, async (req, res) => {
  try {
    const { email, purpose, mobile } = req.body;
    const identifier = email || mobile;

    if (!identifier) {
      return errorResponse(res, 400, "Email or Mobile is required");
    }

    if (!["signup", "login", "reset"].includes(purpose)) {
      return errorResponse(res, 400, "Invalid purpose");
    }

    let existUser;
    if (purpose !== "reset") {
      existUser = await userModel.findOne({
        $or: [{ email: identifier }, { mobile: identifier }],
      });
    }

    // Commented for testing
    // if (purpose == "signup" && existUser) {
    //   return errorResponse(res, 400, "User already exists");
    // }

    if (purpose == "login" && !existUser) {
      return errorResponse(res, 400, "User not exists");
    }
    // resend protection
    const existingOtp = await otpModel.findOne({ identifier: email, purpose });

    if (existingOtp) {
      const diff = Date.now() - existingOtp.updatedAt.getTime();

      if (diff < 30 * 1000) {
        return res.status(429).json({ message: "Wait 30 seconds" });
      }
    }

    const otp = generateOTP();

    const otpData = {
      identifier,
      purpose,
      channel: email ? "email" : "mobile",
      otp: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    };

    await otpModel.findOneAndUpdate({ identifier, purpose }, otpData, {
      upsert: true,
      new: true,
    });

    return successResponse(res, 200, "OTP generated successfully", otp);
  } catch (error) {
    console.log("Error in generating otp :", error);
    return errorResponse(res, 400, "Something went wrong");
  }
});

authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, purpose, mobile, otp } = req.body;
    const identifier = email || mobile;

    if (!identifier) {
      return errorResponse(res, 400, "Email or Mobile is required");
    }

    if (!otp) {
      return errorResponse(res, 400, "Please provide OTP");
    }

    if (!["signup", "login", "reset"].includes(purpose)) {
      return errorResponse(res, 400, "Invalid purpose");
    }

    let existUser = await userModel.findOne({
      $or: [{ email: identifier }, { mobile: identifier }],
    });

    if (purpose !== "signup" && !existUser) {
      return errorResponse(res, 404, "User not found");
    }

    if (otp.length !== 6) {
      return errorResponse(res, 400, "Invalid OTP format");
    }
    const savedOtp = await otpModel.findOne({ identifier, purpose });
    if (!savedOtp) {
      return errorResponse(res, 404, "OTP not found or expired");
    }

    if (savedOtp.expiresAt.getTime() < Date.now()) {
      return errorResponse(res, 400, "OTP expired");
    }

    if (savedOtp.attempts >= 5) {
      return errorResponse(res, 429, "Too many wrong attempts");
    }
    if (otp !== savedOtp.otp) {
      await otpModel.updateOne(
        { _id: savedOtp._id },
        { $inc: { attempts: 1 } },
      );
      return errorResponse(res, 400, "Incorrect OTP");
    }
    await otpModel.deleteOne({ _id: savedOtp._id });

    // handle by purpose
    if (purpose === "signup" && email) {
      await userModel.findOneAndUpdate(
        { email },
        { $set: { isEmailVerified: true } },
      );
    }

    if (purpose === "signup" && mobile) {
      await userModel.findOneAndUpdate(
        { mobile },
        { $set: { isMobileVerified: true } },
      );
    }

    if (purpose === "login") {
      const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);
      res.cookie("accessToken", accessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);

      return successResponse(res, 200, "Logged in Successfully");
    }

    if (purpose === "reset") {
      // later: allow password reset flow
    }

    return successResponse(res, 200, "OTP verified successfully");
  } catch (error) {
    console.log("Error in verifying OTP:", error);
    return errorResponse(res, 500, "Something went wrong");
  }
});

module.exports = authRouter;
