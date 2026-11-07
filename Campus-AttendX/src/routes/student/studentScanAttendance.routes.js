const express = require("express");
const router = express.Router();

// 1. Controller Import
const { scanAttendance } = require("../../controllers/student/studentScanAttendance.controller");

// 2. Middleware Imports
// ⚠️ DHYAN DEIN: Agar error aaye, toh check karein ki in files me `module.exports = authMiddleware` hai ya `module.exports = { authMiddleware }`.
// Agar curly braces wala export hai, toh yahan bhi `const { authMiddleware } = require(...)` karna hoga.
const authMiddleware = require("../../middleware/authMiddleware"); 
const roleMiddleware = require("../../middleware/role.middleware");

// 3. Route Definition (Explicitly passing middlewares)
router.post(
  "/scan", 
  authMiddleware,               // Token verify karega
  roleMiddleware("student"),    // Role check karega
  scanAttendance                // Attendance mark karega
);

module.exports = router;