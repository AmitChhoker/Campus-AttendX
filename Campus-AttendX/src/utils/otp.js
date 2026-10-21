const crypto = require("crypto");

function generateOtp() {
    // 6-digit OTP (100000–999999), cryptographically random
    return crypto.randomInt(100000, 1000000).toString();
}

module.exports = { generateOtp };