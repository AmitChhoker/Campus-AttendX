const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Client ko initialize karein agar keys available hain
let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

async function sendSms(phone, message) {
    // 1. Agar Twilio configure nahi hai, toh log karke chup-chaap return ho jao
    if (!client || !twilioPhoneNumber) {
        console.log(`[SMS-STUB] Twilio not configured. → +91${phone}: ${message}`);
        return { sid: "stub", status: "stubbed" };
    }

    // 2. Phone number ko format karein (Twilio ko +91XXXXXX format chahiye)
    let formattedPhone = phone.toString().replace(/\s+/g, ''); // Spaces hatayein
    if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
            formattedPhone = `+${formattedPhone}`; // Agar 91 pehle se hai
        } else {
            formattedPhone = `+91${formattedPhone}`; // Agar sirf 10 digit hai
        }
    }

    // 3. SMS bhejein Error Handling ke saath
    try {
        const response = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formattedPhone
        });

        console.log(`[SMS SENT] To: ${formattedPhone} | SID: ${response.sid}`);
        return response;
    } catch (error) {
        console.error(`[SMS ERROR] Failed to send to ${formattedPhone}:`, error.message);
        // Error throw karein taaki controller isko pakad sake aur frontend ko bata sake
        throw new Error(`SMS sending failed: ${error.message}`);
    }
}

module.exports = { sendSms };