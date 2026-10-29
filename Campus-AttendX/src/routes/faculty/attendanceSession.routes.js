const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

// Saare controllers ek hi jagah se import karein (No Duplicates)
const {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    getSessionQrPayload,
    getSessionBlePayload,
    getAttendanceSummary,
    closeAttendanceSession,
    markAttendance,
    deleteAttendanceRecord,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport,
    sendWarnings
} = require("../../controllers/faculty/attendanceSession.controller");

// ==========================================
// Faculty Routes
// ==========================================

// Create session
router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    createAttendanceSession
);

// My sessions
router.get(
    "/my-sessions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySessions
);

// ==========================================
// Reports & Warnings (Always above /:id)
// ==========================================
router.get(
    "/reports/monthly",
    authMiddleware,
    roleMiddleware("faculty"),
    getMonthlyAttendanceReport
);

router.get(
    "/reports/monthly/download",
    authMiddleware,
    roleMiddleware("faculty"),
    downloadMonthlyAttendanceReport
);

router.post(
    "/reports/send-bulk",
    authMiddleware,
    roleMiddleware("faculty"),
    sendWarnings
);

// ==========================================
// Session Specific Routes
// ==========================================
router.get(
    "/:id/qr",
    authMiddleware,
    roleMiddleware("faculty"),
    getSessionQrPayload
);

router.get(
    "/:id/ble",
    authMiddleware,
    roleMiddleware("faculty"),
    getSessionBlePayload
);

router.get(
    "/:id/summary",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSummary
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSessionById
);

router.patch(
    "/:id/close",
    authMiddleware,
    roleMiddleware("faculty"),
    closeAttendanceSession
);

router.delete(
    "/:id/attendance/:studentId",
    authMiddleware,
    roleMiddleware("faculty"),
    deleteAttendanceRecord
);

// Legacy student mark
router.post(
    "/:id/mark",
    authMiddleware,
    roleMiddleware("student"),
    markAttendance
);

module.exports = router;