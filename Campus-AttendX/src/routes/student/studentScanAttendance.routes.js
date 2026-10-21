const express = require("express");

const authMiddleware = require(
  "../../middleware/authMiddleware"
);

const roleMiddleware = require(
  "../../middleware/role.middleware"
);

const {
  scanAttendance,
} = require(
  "../../controllers/student/studentScanAttendance.controller"
);

const router = express.Router();

// Only authenticated students can use this endpoint.
router.use(
  authMiddleware,
  roleMiddleware("student")
);

// POST /api/student/scan-attendance/scan
router.post("/scan", scanAttendance);

module.exports = router;