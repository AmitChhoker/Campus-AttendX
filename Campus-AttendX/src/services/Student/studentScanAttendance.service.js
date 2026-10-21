const mongoose = require("mongoose");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");

const { validateDynamicQrPayload } = require("../../utils/dynamicQr");
const {
  validateBlePayload,
  BLE_MIN_RSSI,
  BLE_MAX_RSSI,
} = require("../../utils/dynamicBle");
const {
  verifyProof,
  DEVICE_PROOF_PREFIX,
  FINGERPRINT_PROOF_PREFIX,
} = require("../../utils/deviceBinding");

const REQUIRE_BLE = process.env.REQUIRE_BLE === "true";
const REQUIRE_FINGERPRINT = process.env.REQUIRE_FINGERPRINT === "true";

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Full 4-step attendance marking.
 *
 * Steps enforced (server-side):
 *   1. QR    — mandatory
 *   2. BLE   — optional unless REQUIRE_BLE=true
 *   3. Device binding — mandatory
 *   4. Fingerprint — optional unless REQUIRE_FINGERPRINT=true
 *
 * If a proof is provided, it MUST be valid (never silently ignored).
 */
const scanAttendance = async ({
  studentId,
  sessionId,
  window,          // QR window
  qrToken,         // QR token
  bleWindow,       // BLE window (optional)
  bleToken,        // BLE token (optional)
  bleRssi,         // BLE RSSI in dBm (optional, required if bleToken supplied)
  deviceId,        // Bound device ID
  deviceProof,     // HMAC(deviceKey, "device:" + challenge)
  fingerprintProof // HMAC(deviceKey, "fingerprint:" + challenge) (optional)
}) => {
  // ---------- 1. Basic validation ----------
  if (!mongoose.isValidObjectId(studentId)) {
    throw createError("Invalid student ID.", 400);
  }
  if (!mongoose.isValidObjectId(sessionId)) {
    throw createError("Invalid attendance session ID.", 400);
  }

  // ---------- 2. QR validation ----------
  const validQr = validateDynamicQrPayload({ sessionId, window, qrToken });
  if (!validQr) {
    throw createError(
      "QR code is invalid or expired. Please scan the latest QR code.",
      400
    );
  }

  // ---------- 3. Fetch session & student (need bleSecret + deviceKey) ----------
  const session = await AttendanceSession.findById(sessionId)
    .select("+bleSecret")
    .populate("subject");

  if (!session) throw createError("Attendance session not found.", 404);

  if (session.status !== "active") {
    throw createError("This attendance session is no longer active.", 400);
  }

  const now = new Date();

  if (session.expiresAt <= now) {
    await AttendanceSession.updateOne(
      { _id: session._id, status: "active" },
      { $set: { status: "expired" } }
    );
    throw createError("Attendance session has expired.", 400);
  }

  const subject = session.subject;
  if (!subject || !subject.isActive) {
    throw createError("This subject is not available for attendance.", 400);
  }

  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isActive: true
  }).select("+deviceBinding.deviceKey");

  if (!student) throw createError("Student account not found or inactive.", 404);

  if (
    subject.status !== "approved" ||
    subject.course !== student.course ||
    subject.branch !== student.branch ||
    subject.semester !== student.semester
  ) {
    throw createError("You are not eligible to attend this subject.", 403);
  }

  // ---------- 4. BLE validation ----------
  let bleVerified = false;

  if (bleToken !== undefined && bleToken !== null) {
    if (
      typeof bleRssi !== "number" ||
      bleRssi < BLE_MIN_RSSI ||
      bleRssi > BLE_MAX_RSSI
    ) {
      throw createError(
        `BLE signal strength out of range (${bleRssi ?? "?"} dBm). ` +
          `Move closer to the teacher and try again.`,
        400
      );
    }

    const validBle = validateBlePayload({
      bleSecret: session.bleSecret,
      window: bleWindow,
      bleToken
    });

    if (!validBle) {
      throw createError(
        "BLE proximity verification failed. Please ensure you are near the teacher's device.",
        400
      );
    }

    bleVerified = true;
  } else if (REQUIRE_BLE) {
    throw createError(
      "BLE proximity proof is required. Please enable Bluetooth and try again.",
      400
    );
  }

  // ---------- 5. Device binding validation ----------
  if (!student.deviceBinding || !student.deviceBinding.deviceId) {
    throw createError(
      "No device is bound to your account. Please bind a device first.",
      400
    );
  }

  if (student.deviceBinding.deviceId !== deviceId) {
    throw createError(
      "This is not your bound device. Please log in on your bound device or ask an admin to reset it.",
      403
    );
  }

  if (!student.deviceBinding.deviceKey) {
    throw createError(
      "Device key is missing. Please re-bind your device.",
      400
    );
  }

  const challenge = `${sessionId}:${window}:${qrToken}`;

  const deviceVerified = verifyProof({
    secret: student.deviceBinding.deviceKey,
    prefix: DEVICE_PROOF_PREFIX,
    challenge,
    proof: deviceProof
  });

  if (!deviceVerified) {
    throw createError("Device verification failed.", 403);
  }

  // ---------- 6. Fingerprint validation ----------
  let fingerprintVerified = false;

  if (fingerprintProof !== undefined && fingerprintProof !== null) {
    fingerprintVerified = verifyProof({
      secret: student.deviceBinding.deviceKey,
      prefix: FINGERPRINT_PROOF_PREFIX,
      challenge,
      proof: fingerprintProof
    });

    if (!fingerprintVerified) {
      throw createError("Fingerprint authentication failed.", 403);
    }
  } else if (REQUIRE_FINGERPRINT) {
    throw createError(
      "Fingerprint authentication is required. Please authenticate and try again.",
      400
    );
  }

  // ---------- 7. Duplicate check ----------
  const existing = await Attendance.findOne({
    session: session._id,
    student: student._id
  });

  if (existing) {
    throw createError(
      "Your attendance has already been recorded for this session.",
      409
    );
  }

  // ---------- 8. Persist ----------
  try {
    const attendance = await Attendance.create({
      session: session._id,
      student: student._id,
      markedAt: now,
      status: "present",
      verification: {
        qrVerified: true,
        bleVerified,
        bleRssi: bleVerified ? bleRssi : null,
        deviceVerified,
        deviceId: deviceId || null,
        fingerprintVerified
      }
    });

    return {
      attendanceId: attendance._id,
      status: attendance.status,
      markedAt: attendance.markedAt,
      session: {
        sessionId: session._id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt
      },
      verification: attendance.verification,
      message: "Attendance marked successfully."
    };
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "Your attendance has already been recorded for this session.",
        409
      );
    }
    throw error;
  }
};

module.exports = { scanAttendance };