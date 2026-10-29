const express = require("express");
const router = express.Router();
const { scanAttendance } = require("../../controllers/student/studentScanAttendance.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

// Middleware
router.use(authMiddleware, roleMiddleware("student"));

// POST /api/student/scan-attendance/scan
router.post("/scan", scanAttendance);

module.exports = router;