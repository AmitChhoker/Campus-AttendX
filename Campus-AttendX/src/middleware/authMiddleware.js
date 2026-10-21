const jwt = require("jsonwebtoken");

const authentication = async (req, res, next) => {
    try {
        // Get access token from the cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }

        // Verify JWT
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        // Check whether the token has been revoked in Redis
        const redisClient = require("../config/redis");

        const isBlocked = await redisClient.get(`token:${token}`);

        if (isBlocked) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked. Please log in again."
            });
        }

        // Store authenticated user information
        req.user = {
            id: payload._id,
            emailId: payload.emailId,
            role: payload.role,
            adminBranch: payload.adminBranch || null
        };

        return next();

    } catch (err) {
        // Handle invalid or expired JWTs
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
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