const crypto = require("crypto");

// 🔥 30 seconds se badhakar 300 seconds (5 minutes) kar diya
const QR_INTERVAL_SECONDS = 300; 

const getQrSecret = () => {
  const secret = process.env.QR_SECRET_KEY;
  if (!secret) throw new Error("QR_SECRET_KEY is not configured.");
  return secret;
};

const generateQrToken = (sessionId, windowNumber) => {
  return crypto
    .createHmac("sha256", getQrSecret())
    .update(`${sessionId}:${windowNumber}`)
    .digest("hex");
};

const generateDynamicQrPayload = (sessionId, now = Date.now()) => {
  const windowNumber = Math.floor(now / (QR_INTERVAL_SECONDS * 1000));
  const qrToken = generateQrToken(sessionId, windowNumber);

  return {
    sessionId: sessionId.toString(),
    window: windowNumber,
    qrToken,
    expiresAt: (windowNumber + 1) * QR_INTERVAL_SECONDS * 1000,
  };
};

const validateDynamicQrPayload = ({ sessionId, window, qrToken, now = Date.now() }) => {
  if (!sessionId || !Number.isSafeInteger(window) || typeof qrToken !== "string" || !/^[a-f0-9]{64}$/i.test(qrToken)) {
    return false;
  }

  const currentWindow = Math.floor(now / (QR_INTERVAL_SECONDS * 1000));

  // 🔥 Testing ke liye pichle 2 window (total 15 minute) tak token valid rahega
  if (window !== currentWindow && window !== currentWindow - 1 && window !== currentWindow - 2) {
    return false;
  }

  const expectedToken = generateQrToken(sessionId, window);
  const receivedBuffer = Buffer.from(qrToken, "hex");
  const expectedBuffer = Buffer.from(expectedToken, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

module.exports = {
  QR_INTERVAL_SECONDS,
  generateDynamicQrPayload,
  validateDynamicQrPayload,
};