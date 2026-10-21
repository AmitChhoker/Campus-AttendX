const crypto = require("crypto");

// Distinct prefixes keep device and fingerprint proofs non-interchangeable.
const DEVICE_PROOF_PREFIX = "device:";
const FINGERPRINT_PROOF_PREFIX = "fingerprint:";

/**
 * Generate a fresh 256-bit device key (hex).
 * Sent to the client ONCE at bind time. Never stored on the server in
 * selectable form after binding (see User model: deviceKey has select:false).
 */
const generateDeviceKey = () => crypto.randomBytes(32).toString("hex");

/**
 * Generate a device or fingerprint proof.
 * proof = HMAC-SHA256(deviceKey, prefix || challenge)
 */
const generateProof = (secret, prefix, challenge) => {
  return crypto
    .createHmac("sha256", secret)
    .update(prefix + challenge)
    .digest("hex");
};

/**
 * Constant-time proof verification.
 */
const verifyProof = ({ secret, prefix, challenge, proof }) => {
  if (
    typeof proof !== "string" ||
    !/^[a-f0-9]{64}$/i.test(proof) ||
    !secret ||
    typeof secret !== "string"
  ) {
    return false;
  }

  const expected = generateProof(secret, prefix, challenge);

  const a = Buffer.from(proof, "hex");
  const b = Buffer.from(expected, "hex");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

module.exports = {
  DEVICE_PROOF_PREFIX,
  FINGERPRINT_PROOF_PREFIX,
  generateDeviceKey,
  generateProof,
  verifyProof,
};