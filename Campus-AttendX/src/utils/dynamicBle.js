const crypto = require("crypto");

// BLE token rotates every 15 seconds
const BLE_INTERVAL_SECONDS = 15;

// Acceptable RSSI range (dBm). Anything outside is rejected:
//   too weak  → student isn't in the room
//   too strong → spoofed (real BLE in a classroom is rarely < -30 dBm)
const BLE_MIN_RSSI = -80;
const BLE_MAX_RSSI = -30;

const generateBleToken = (bleSecret, windowNumber) => {
  return crypto
    .createHmac("sha256", bleSecret)
    .update(`ble:${windowNumber}`)
    .digest("hex");
};

const generateBlePayload = (sessionId, bleSecret, now = Date.now()) => {
  const windowNumber = Math.floor(now / (BLE_INTERVAL_SECONDS * 1000));

  return {
    sessionId: sessionId.toString(),
    window: windowNumber,
    bleToken: generateBleToken(bleSecret, windowNumber),
    expiresAt: (windowNumber + 1) * BLE_INTERVAL_SECONDS * 1000,
  };
};

const validateBlePayload = ({
  bleSecret,
  window,
  bleToken,
  now = Date.now(),
}) => {
  if (
    !bleSecret ||
    !Number.isSafeInteger(window) ||
    typeof bleToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(bleToken)
  ) {
    return false;
  }

  const currentWindow = Math.floor(now / (BLE_INTERVAL_SECONDS * 1000));

  // Accept current or previous BLE window (in-flight tolerance)
  if (window !== currentWindow && window !== currentWindow - 1) {
    return false;
  }

  const expectedToken = generateBleToken(bleSecret, window);

  const a = Buffer.from(bleToken, "hex");
  const b = Buffer.from(expectedToken, "hex");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

module.exports = {
  BLE_INTERVAL_SECONDS,
  BLE_MIN_RSSI,
  BLE_MAX_RSSI,
  generateBlePayload,
  validateBlePayload,
};