const userModel = require("../models/user");
const { errorResponse, successResponse } = require("../utils/response");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.headers["authorization"];
        // if (!token && !token.startsWith("Bearer ")) {
        //     return errorResponse(res, 401, "Invalid Token");
        // }
        // token = token.split(" ")[1];
        if (!token)
            return errorResponse(res, 401, "Authorization token missing or invalid");

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not configured");
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decode.id).select("-password");
        if (!user) return errorResponse(res, 401, "Unauthorized");
        req.user = user;
        next();
    } catch (error) {
        console.log("Auth middleware error:", error);
        return errorResponse(res, 401, "Invalid or expired token");
    }
};

module.exports = { authMiddleware };
