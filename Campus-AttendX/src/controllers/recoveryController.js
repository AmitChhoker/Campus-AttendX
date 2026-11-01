const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp } = require('../utils/otp');
const { sendSms } = require('../utils/sms'); // 🔥 Ab SMS utility use ho rahi hai

// Step 1: User requests OTP using their phone number
const requestOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) throw new Error("Phone number is required");

        const user = await User.findOne({ phone });
        if (!user) throw new Error("No account found with this phone number");

        const otp = generateOtp();

        // Purane OTPs delete karein
        await Otp.deleteMany({ phone });

        // Naya OTP database mein save karein
        await Otp.create({ phone, otp, purpose: "account-recovery" });

        // 🔥 SMS bhejein (Ab Twilio use hoga)
        const smsMessage = `Your AttendX recovery OTP is ${otp}. It is valid for 5 minutes. Do not share this code.`;
        
        await sendSms(phone, smsMessage);

        res.status(200).json({ message: "OTP sent successfully to your mobile number" });
    } catch (err) {
        console.error("Recovery Error:", err.message);
        // Agar Twilio fail hota hai, toh frontend ko wahi error dikhega
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

        // OTP verify ho gaya, ab delete kar dein
        await Otp.deleteOne({ _id: otpRecord._id });

        // Email ko mask karke frontend ko bhejein
        const maskedEmail = user.emailId.replace(/(.{2})(.*)(@.*)/, "$1***$3");

        res.status(200).json({
            message: "OTP verified",
            emailId: maskedEmail
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { requestOtp, verifyOtp };