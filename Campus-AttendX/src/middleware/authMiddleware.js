const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis"); // Apna path check kar lein

const authMiddleware = async (req, res, next) => {
    try {
        // Header se token uthayein, agar nahi mile toh cookie se
        let token = req.cookies?.token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Token is missing" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // (Redis blacklist check yahan rahega)

        req.user = {
            id: payload._id,
            role: payload.role,
            adminBranch: payload.adminBranch || null
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;