const crypto = require("crypto");

const DEVICE_PROOF_PREFIX = "device:";
const FINGERPRINT_PROOF_PREFIX = "fingerprint:";

// 🔥 Ye function missing tha jiski wajah se error aa raha tha
const verifyProof = ({ secret, prefix, challenge, proof }) => {
  if (!secret || !proof) return false;
  
  try {
    // Frontend jaisa hi HMAC SHA-256 generate karna
    const expectedProof = crypto
      .createHmac("sha256", secret)
      .update(prefix + challenge)
      .digest("hex");

    // Timing attack se bachne ke liye secure compare
    const proofBuffer = Buffer.from(proof, "hex");
    const expectedBuffer = Buffer.from(expectedProof, "hex");

    if (proofBuffer.length !== expectedBuffer.length) return false;
    
    return crypto.timingSafeEqual(proofBuffer, expectedBuffer);
  } catch (err) {
    console.error("Verify Proof Error:", err);
    return false;
  }
};

module.exports = {
  verifyProof,
  DEVICE_PROOF_PREFIX,
  FINGERPRINT_PROOF_PREFIX
};