const validUser = require("../utils/validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

// =====================================================
// COOKIE OPTIONS FOR PRODUCTION (Cross-Domain)
// =====================================================
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Render par true
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-domain ke liye
    maxAge
});

// =====================================================
// REGISTER
// =====================================================
const register = async (req, res) => {
    try {
        validUser(req.body);
        const userData = { ...req.body };

        if (userData.role === "student") {
            userData.batch = Number(userData.batch);
            userData.semester = Number(userData.semester);
            userData.branch = userData.branch.toUpperCase();
            userData.course = userData.course.toUpperCase();
            userData.department = userData.department.toUpperCase();
        }

        userData.password = await bcrypt.hash(userData.password, 10);
        const user = await User.create(userData);
        const { password, ...userResponse } = user.toObject();

        return res.status(201).json({
            success: true,
            message: `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} created successfully`,
            user: userResponse
        });
    } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern || {})[0] || "Field";
            return res.status(409).json({ success: false, message: `${duplicateField} already exists. Please use a different one.` });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ success: false, message: err.message });
        }
        console.error("Register error:", err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// =====================================================
// LOGIN
// =====================================================
const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ emailId: emailId.toLowerCase().trim() });

        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
        if (!user.isActive) return res.status(403).json({ success: false, message: "Your account is inactive. Please contact the administrator." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const accessToken = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role, adminBranch: user.role === "admin" ? user.adminBranch : null },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        await redisClient.set(`refreshToken:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

        user.lastLogin = new Date();
        await user.save();

        // Apply Production Cookie Options
        res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

        return res.status(200).json({ success: true, message: "User login successful" });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// =====================================================
// LOGOUT
// =====================================================
const logout = async (req, res) => {
    try {
        const { token, refreshToken: storedRefreshToken } = req.cookies || {};

        if (token) {
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
                if (payload.exp) await redisClient.set(`token:${token}`, "Blocked", { EXAT: payload.exp });
            } catch (err) { }
        }

        if (storedRefreshToken) {
            try {
                const refreshPayload = jwt.verify(storedRefreshToken, process.env.JWT_REFRESH_SECRET);
                await redisClient.del(`refreshToken:${refreshPayload._id}`);
            } catch (err) { }
        }

        // Clear cookies with same production options
        const clearOptions = getCookieOptions(0);
        res.clearCookie("token", clearOptions);
        res.clearCookie("refreshToken", clearOptions);

        return res.status(200).json({ success: true, message: "User logout successful" });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// =====================================================
// GET CURRENT USER
// =====================================================
const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, message: "User found successfully", user });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: storedRefreshToken } = req.cookies || {};
        if (!storedRefreshToken) return res.status(401).json({ success: false, message: "Refresh token is missing" });

        const payload = jwt.verify(storedRefreshToken, process.env.JWT_REFRESH_SECRET);
        const storedToken = await redisClient.get(`refreshToken:${payload._id}`);

        if (!storedToken || storedToken !== storedRefreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token is invalid or expired" });
        }

        const user = await User.findById(payload._id);
        if (!user || !user.isActive) return res.status(403).json({ success: false, message: "User not found or inactive" });

        const newAccessToken = jwt.sign(
            { _id: user._id, emailId: user.emailId, role: user.role, adminBranch: user.role === "admin" ? user.adminBranch : null },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );

        // Apply Production Cookie Options
        res.cookie("token", newAccessToken, getCookieOptions(15 * 60 * 1000));

        return res.status(200).json({ success: true, message: "Access token refreshed successfully" });
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current password and new password are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) return res.status(401).json({ success: false, message: "Current password is incorrect" });

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) return res.status(400).json({ success: false, message: "New password must be different from old password" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully. Please log in again.", requireLogin: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    register,
    login,
    logout,
    me,
    refreshToken,
    changePassword
};