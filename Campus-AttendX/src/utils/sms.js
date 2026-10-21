const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendSms(phone, message) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
        // Non-blocking stub — logs in dev so recovery still "works"
        console.log(`[SMS-STUB] → +91${phone}: ${message}`);
        return { sid: "stub" };
    }

    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${phone}`
    });
}

module.exports = { sendSms };