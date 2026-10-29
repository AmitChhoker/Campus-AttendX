const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis"); // Apna path check kar lein

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Token ko Cookies aur Authorization Header dono se check karein
        let token = req.cookies?.token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }

        // 2. Verify JWT
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // 3. Check if token is blacklisted (Redis)
        const isBlocked = await redisClient.get(`token:${token}`);
        if (isBlocked) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked. Please log in again."
            });
        }

        // 4. Attach user to request
        req.user = {
            id: payload._id,
            emailId: payload.emailId,
            role: payload.role,
            adminBranch: payload.adminBranch || null
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
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

module.exports = authMiddleware;