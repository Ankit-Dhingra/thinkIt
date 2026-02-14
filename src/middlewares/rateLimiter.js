const rateLimiter = require("express-rate-limit");
const { errorResponse } = require("../utils/response");
const { ipKeyGenerator } = require("express-rate-limit");

const globalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      "Too many requests. Please try again later.",
    );
  },
});

const loginRateLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000,
  keyGenerator: (req) => {
    const email = req.body.email?.toLowerCase().trim();
    if (email) return `login-email-${email}`;
    // SAFE IP fallback
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      "Too many login attempts. Please try again later.",
    );
  },
});

const otpLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  keyGenerator: (req) => {
    const email = req.body.email?.toLowerCase().trim();
    const mobile = req.body.mobile?.trim();

    if (email) return `otp-email-${email}`;
    if (mobile) return `otp-mobile-${mobile}`;

    // SAFE IP fallback
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      "Too many OTP requests. Please try again later.",
    );
  },
});

module.exports = {
  globalRateLimiter,
  loginRateLimiter,
  otpLimiter,
};
