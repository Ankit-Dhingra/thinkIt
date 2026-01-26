const crypto = require("crypto");
const bcrypt = require("bcrypt");

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const generateOtpHash = async (otp) => {
  const hash  = await bcrypt.hash(otp, 10);
  return hash;
};


module.exports = {generateOTP, generateOtpHash};
