const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

const authentication = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing. Please login again."
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const isBlocked = await redisClient.get(`token:${token}`);
        if (isBlocked) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked. Please log in again."
            });
        }

        // 🔥 FIX: Dono formats handle karein (_id aur id)
        req.user = {
            id: payload._id || payload.id, 
            emailId: payload.emailId,
            role: payload.role,
            adminBranch: payload.adminBranch || null
        };

        return next();

    } catch (err) {
        if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please log in again."
            });
        }
        console.error("Authentication error:", err);
        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

module.exports = authentication;