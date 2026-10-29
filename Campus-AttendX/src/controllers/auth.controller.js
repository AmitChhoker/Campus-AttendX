const validUser = require("../utils/validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const Otp = require("../models/Otp");
const { sendSms } = require("../utils/sms");

// Helper function (Ab logout aur refresh token dono mein kaam aayega)
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: true, // Live (HTTPS) par hamesha true hona chahiye
    sameSite: "none", // Vercel se Render cross-domain ke liye "none" zaroori hai
    maxAge
});

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
        return res.status(400).json({ success: false, message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        const user = await User.findOne({ emailId: emailId.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found. Please register first." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is inactive" });
        }

        // Tokens Generate karein
        const accessToken = jwt.sign(
            { _id: user._id, role: user.role, adminBranch: user.adminBranch }, 
            process.env.JWT_SECRET_KEY, 
            { expiresIn: "1d" } // Thoda time badha diya testing ke liye
        );
        
        const refreshToken = jwt.sign(
            { _id: user._id }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: "7d" }
        );

        // Redis mein refresh token save karein
        await redisClient.set(`refreshToken:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

        // 🔥 SIRF EK BAAR RESPONSE BHEJEIN (Purana res.cookie wala code hata dein)
        return res.status(200).json({ 
            success: true, 
            message: "Login successful",
            token: accessToken, // Frontend isko LocalStorage mein save karega
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                role: user.role,
                semester: user.semester,
                branch: user.branch,
                course: user.course
            }
        });

    } catch (err) { 
        console.error("Login Error:", err.message);
        
        // Agar headers pehle hi send ho chuke hain, toh dobara send mat karein
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
};

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

        // Clear cookies
        res.clearCookie("token", getCookieOptions(0));
        res.clearCookie("refreshToken", getCookieOptions(0));

        return res.status(200).json({ success: true, message: "User logout successful" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, message: "User found successfully", user });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

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

        res.cookie("token", newAccessToken, getCookieOptions(15 * 60 * 1000));

        return res.status(200).json({ success: true, message: "Access token refreshed successfully" });
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
};

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

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false, message: "No account found with this phone number" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ phone });
        await Otp.create({ phone, otp });
        await sendSms(phone, `Your AttendX password reset OTP is ${otp}`);
        
        res.json({ success: true, message: "OTP sent successfully to your phone." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const resetPasswordWithOtp = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        const otpRecord = await Otp.findOne({ phone, otp });
        if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await Otp.deleteOne({ _id: otpRecord._id });

        res.json({ success: true, message: "Password reset successfully. Please login." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    register, login, logout, me, refreshToken, changePassword, sendOtp, resetPasswordWithOtp 
};