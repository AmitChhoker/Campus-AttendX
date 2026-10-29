const mongoose = require("mongoose");

const User = require("../../models/User");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");

const { validateDynamicQrPayload } = require("../../utils/dynamicQr");
const { validateBlePayload, BLE_MIN_RSSI, BLE_MAX_RSSI } = require("../../utils/dynamicBle");
const { verifyProof, DEVICE_PROOF_PREFIX, FINGERPRINT_PROOF_PREFIX } = require("../../utils/deviceBinding");

// Environment variables se strictness check karein
const REQUIRE_BLE = process.env.REQUIRE_BLE === "true";
const REQUIRE_FINGERPRINT = process.env.REQUIRE_FINGERPRINT === "true";

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const scanAttendance = async ({
  studentId,
  sessionId,
  window: qrWindow,
  qrToken,
  bleWindow,
  bleToken,
  bleRssi,
  deviceId,
  deviceProof,
  fingerprintProof
}) => {
  // 1. Basic Validation
  if (!mongoose.isValidObjectId(studentId)) throw createError("Invalid student ID.", 400);
  if (!mongoose.isValidObjectId(sessionId)) throw createError("Invalid attendance session ID.", 400);

  // 2. QR Validation
  const validQr = validateDynamicQrPayload({ sessionId, window: qrWindow, qrToken });
  if (!validQr) {
    throw createError("QR code is invalid or expired. Please scan the latest QR code.", 400);
  }

  // 3. Fetch Session & Student
  const session = await AttendanceSession.findById(sessionId)
    .select("+bleSecret")
    .populate("subject");

  if (!session) throw createError("Attendance session not found.", 404);

  // Check if session is closed or expired
  if (session.status !== "active") {
    throw createError("This session has been closed by the teacher. Please ask them to start a new one.", 400);
  }

  const now = new Date();
  if (session.expiresAt <= now) {
    await AttendanceSession.updateOne({ _id: session._id, status: "active" }, { $set: { status: "expired" } });
    throw createError("Attendance session has expired. Please ask the teacher to start a new session.", 400);
  }

  // 4. Fetch Student
  const student = await User.findOne({ _id: studentId, role: "student", isActive: true }).select("+deviceBinding.deviceKey");
  if (!student) throw createError("Student account not found or inactive.", 404);

  // Subject Eligibility Check
  const subject = session.subject;
  if (!subject || !subject.isActive || subject.status !== "approved") {
    throw createError("The subject associated with this session is unavailable.", 400);
  }
  if (subject.course !== student.course || subject.branch !== student.branch || subject.semester !== student.semester) {
    throw createError("You are not eligible to attend this subject.", 403);
  }

  // 5. BLE Validation (Optional in Web)
  let bleVerified = false;
  if (bleToken && bleWindow !== undefined) {
    if (typeof bleRssi !== "number" || bleRssi < BLE_MIN_RSSI || bleRssi > BLE_MAX_RSSI) {
      throw createError(`BLE signal out of range (${bleRssi} dBm). Move closer to the teacher.`, 400);
    }
    const validBle = validateBlePayload({ bleSecret: session.bleSecret, window: bleWindow, bleToken });
    if (!validBle) throw createError("BLE proximity verification failed.", 400);
    bleVerified = true;
  } else if (REQUIRE_BLE) {
    throw createError("BLE proximity proof is required, but not provided by your device.", 400);
  }

  // 6. Device Binding Validation (Mandatory)
  if (!student.deviceBinding || !student.deviceBinding.deviceId) {
    throw createError("No device is bound to your account. Please refresh and try again.", 400);
  }
  if (student.deviceBinding.deviceId !== deviceId) {
    throw createError("This is not your bound device. Please ask an admin to reset your device.", 403);
  }
  if (!student.deviceBinding.deviceKey) {
    throw createError("Device key is missing. Please re-bind your device.", 400);
  }

  const challenge = `${sessionId}:${qrWindow}:${qrToken}`;
  
  const deviceVerified = verifyProof({
    secret: student.deviceBinding.deviceKey,
    prefix: DEVICE_PROOF_PREFIX,
    challenge,
    proof: deviceProof
  });

  if (!deviceVerified) throw createError("Device verification failed. Invalid Proof.", 403);

  // 7. Fingerprint Validation (Optional in Web, but strict if true)
  let fingerprintVerified = false;
  if (fingerprintProof) {
    fingerprintVerified = verifyProof({
      secret: student.deviceBinding.deviceKey,
      prefix: FINGERPRINT_PROOF_PREFIX,
      challenge,
      proof: fingerprintProof
    });
    if (!fingerprintVerified) throw createError("Fingerprint authentication failed.", 403);
  } else if (REQUIRE_FINGERPRINT) {
    throw createError("Fingerprint authentication is required.", 400);
  }

  // 8. Duplicate Check
  const existing = await Attendance.findOne({ session: session._id, student: student._id });
  if (existing) {
    throw createError("Your attendance is already marked for this session.", 409);
  }

  // 9. Save Attendance
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
      subjectName: subject.subjectName,
      verification: attendance.verification,
      message: "Attendance marked successfully."
    };
  } catch (error) {
    if (error.code === 11000) throw createError("Attendance already marked.", 409);
    throw error;
  }
};

module.exports = { scanAttendance };