const mongoose = require("mongoose");
const User = require("../../models/User");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");
const { validateDynamicQrPayload } = require("../../utils/dynamicQr");
const { validateBlePayload, BLE_MIN_RSSI, BLE_MAX_RSSI } = require("../../utils/dynamicBle");
const { verifyProof, DEVICE_PROOF_PREFIX, FINGERPRINT_PROOF_PREFIX } = require("../../utils/deviceBinding");

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const scanAttendance = async ({
  studentId, sessionId, window: qrWindow, qrToken, bleWindow, bleToken, bleRssi, deviceId, deviceProof, fingerprintProof
}) => {
  // 🔥 FIX: Check if studentId exists before validating ObjectId
  if (!studentId) throw createError("Student ID is missing. Please login again.", 401);
  if (!mongoose.isValidObjectId(studentId)) throw createError("Invalid student ID.", 400);
  if (!mongoose.isValidObjectId(sessionId)) throw createError("Invalid attendance session ID.", 400);

  const validQr = validateDynamicQrPayload({ sessionId, window: qrWindow, qrToken });
  if (!validQr) throw createError("QR code is invalid or expired. Please scan the latest QR code.", 400);

  const session = await AttendanceSession.findById(sessionId).select("+bleSecret").populate("subject");
  if (!session) throw createError("Attendance session not found.", 404);

  if (session.status !== "active") throw createError("This session has been closed by the teacher.", 400);

  const now = new Date();
  if (session.expiresAt <= now) {
    await AttendanceSession.updateOne({ _id: session._id, status: "active" }, { $set: { status: "expired" } });
    throw createError("Attendance session has expired.", 400);
  }

  const student = await User.findOne({ _id: studentId, role: "student", isActive: true }).select("+deviceBinding.deviceKey");
  if (!student) throw createError("Student account not found or inactive.", 404);

  const subject = session.subject;
  if (!subject || !subject.isActive || subject.status !== "approved") throw createError("The subject is unavailable.", 400);
  if (subject.course !== student.course || subject.branch !== student.branch || subject.semester !== student.semester) throw createError("You are not eligible for this subject.", 403);

  if (!student.deviceBinding || !student.deviceBinding.deviceId) throw createError("No device is bound to your account.", 400);
  if (student.deviceBinding.deviceId !== deviceId) throw createError("This is not your bound device.", 403);
  if (!student.deviceBinding.deviceKey) throw createError("Device key is missing.", 400);

  const challenge = `${sessionId}:${qrWindow}:${qrToken}`;
  
  const deviceVerified = verifyProof({ secret: student.deviceBinding.deviceKey, prefix: DEVICE_PROOF_PREFIX, challenge, proof: deviceProof });
  if (!deviceVerified) throw createError("Device verification failed.", 403);

  let fingerprintVerified = false;
  if (fingerprintProof) {
    fingerprintVerified = verifyProof({ secret: student.deviceBinding.deviceKey, prefix: FINGERPRINT_PROOF_PREFIX, challenge, proof: fingerprintProof });
    if (!fingerprintVerified) throw createError("Fingerprint authentication failed.", 403);
  }

  const existing = await Attendance.findOne({ session: session._id, student: student._id });
  if (existing) throw createError("Your attendance is already marked for this session.", 409);

  try {
    const attendance = await Attendance.create({
      session: session._id,
      student: student._id,
      markedAt: now,
      status: "present",
      verification: { qrVerified: true, deviceVerified, deviceId: deviceId || null, fingerprintVerified }
    });

    return {
      attendanceId: attendance._id,
      status: attendance.status,
      markedAt: attendance.markedAt,
      subjectName: subject.subjectName,
      message: "Attendance marked successfully."
    };
  } catch (error) {
    if (error.code === 11000) throw createError("Attendance already marked.", 409);
    throw error;
  }
};

module.exports = { scanAttendance };