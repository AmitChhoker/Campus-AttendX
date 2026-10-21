// Client-side device binding helpers.
// The deviceKey lives ONLY on this device (localStorage for demo; use
// IndexedDB + WebAuthn-protected storage in production).

const DEVICE_ID_KEY = "attendx_device_id";
const DEVICE_KEY_KEY = "attendx_device_key";

export const getStoredDevice = () => {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  const deviceKey = localStorage.getItem(DEVICE_KEY_KEY);
  if (!deviceId || !deviceKey) return null;
  return { deviceId, deviceKey };
};

export const storeDevice = ({ deviceId, deviceKey }) => {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  localStorage.setItem(DEVICE_KEY_KEY, deviceKey);
};

export const clearDevice = () => {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_KEY_KEY);
};

const randomHex = (bytes) => {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const generateDeviceId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return randomHex(16);
};

export const generateDeviceKey = () => randomHex(32);

/**
 * HMAC-SHA256(deviceKey, prefix + challenge) — browser implementation.
 */
export const generateProof = async (deviceKey, prefix, challenge) => {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(deviceKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(prefix + challenge)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const DEVICE_PROOF_PREFIX = "device:";
export const FINGERPRINT_PROOF_PREFIX = "fingerprint:";