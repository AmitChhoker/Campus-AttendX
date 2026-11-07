const studentScanAttendanceService = require("../../services/student/studentScanAttendance.service");

const scanAttendance = async (req, res, next) => {
  try {
    // 🔥 1. Extract Student ID properly from req.user (JWT Middleware se)
    const studentId = req.user?.id || req.user?._id || req.user?.userId;

    if (!studentId) {
      console.log("🚨 JWT Error: req.user is missing or does not have an ID.");
      return res.status(401).json({
        success: false,
        message: "Invalid student ID. Please login again."
      });
    }

    const {
      sessionId,
      window: qrWindow,
      qrToken,
      bleWindow,
      bleToken,
      bleRssi,
      deviceId,
      deviceProof,
      fingerprintProof
    } = req.body;

    const result = await studentScanAttendanceService.scanAttendance({
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
    });

    return res.status(200).json({
      success: true,
      message: result.message || "Attendance marked successfully.",
      data: result
    });
  } catch (err) {
    console.error("Scan Attendance Controller Error:", err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to mark attendance."
    });
  }
};

module.exports = { scanAttendance };