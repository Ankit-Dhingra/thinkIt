const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "15d",
  });
};

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userModel.findByIdAndUpdate(user._id, { $set: { refreshToken } });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error in generating token :", error);
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAccessAndRefreshToken,
};
