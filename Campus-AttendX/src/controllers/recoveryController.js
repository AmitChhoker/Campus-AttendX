const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp } = require('../utils/otp');
const { sendSms } = require('../utils/sms'); 

// Step 1: User requests OTP using their phone number
const requestOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) throw new Error("Phone number is required");

        const user = await User.findOne({ phone });
        if (!user) throw new Error("No account found with this phone number");

        const otp = generateOtp();

        // Remove any previous unexpired OTP for this phone before creating a new one
        await Otp.deleteMany({ phone });

        await Otp.create({ phone, otp, purpose: "account-recovery" });

        await sendSms(phone, `Your SVSU account recovery OTP is ${otp}. Valid for 5 minutes.`);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Step 2: User submits OTP to verify and recover access
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) throw new Error("Phone and OTP are required");

        const otpRecord = await Otp.findOne({ phone, otp, purpose: "account-recovery" });
        if (!otpRecord) throw new Error("Invalid or expired OTP");

        const user = await User.findOne({ phone });
        if (!user) throw new Error("User not found");

        // OTP verified - delete it so it can't be reused
        await Otp.deleteOne({ _id: otpRecord._id });

        // Reveal masked email, or issue a short-lived reset token instead
        const maskedEmail = user.emailId.replace(/(.{2})(.*)(@.*)/, "$1***$3");

        res.status(200).json({
            message: "OTP verified",
            emailId: maskedEmail
            // Alternative: issue a JWT reset token here instead of showing email directly,
            // then redirect to a "reset password" screen using that token
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { requestOtp, verifyOtp };