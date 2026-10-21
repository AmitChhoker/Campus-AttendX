const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

const {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    getSessionBlePayload,
    getAttendanceSummary,
    closeAttendanceSession,
    markAttendance,
    deleteAttendanceRecord,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport
} = require("../../controllers/faculty/attendanceSession.controller");

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

// Reports (registered before /:id)
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

// QR + BLE payloads
router.get(
    "/:id/qr",
    authMiddleware,
    roleMiddleware("faculty"),
    (req, res, next) => {
        // Delegates to generateDynamicQrPayload — inlined here to keep
        // the route simple. Uses dynamicQr util.
        const { generateDynamicQrPayload } = require("../../utils/dynamicQr");
        const AttendanceSession = require("../../models/AttendanceSession");

        AttendanceSession.findOne({
            _id: req.params.id,
            faculty: req.user.id
        }).then((session) => {
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: "Session not found"
                });
            }
            if (session.status !== "active") {
                return res.status(400).json({
                    success: false,
                    message: "Session is not active"
                });
            }
            return res.status(200).json({
                success: true,
                data: generateDynamicQrPayload(session._id)
            });
        }).catch(next);
    }
);

router.get(
    "/:id/ble",
    authMiddleware,
    roleMiddleware("faculty"),
    getSessionBlePayload
);

// Summary
router.get(
    "/:id/summary",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSummary
);

// Get one
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSessionById
);

// Close
router.patch(
    "/:id/close",
    authMiddleware,
    roleMiddleware("faculty"),
    closeAttendanceSession
);

// Delete one student's attendance
router.delete(
    "/:id/attendance/:studentId",
    authMiddleware,
    roleMiddleware("faculty"),
    deleteAttendanceRecord
);

// Legacy student mark (kept for backward compat)
router.post(
    "/:id/mark",
    authMiddleware,
    roleMiddleware("student"),
    markAttendance
);

module.exports = router;