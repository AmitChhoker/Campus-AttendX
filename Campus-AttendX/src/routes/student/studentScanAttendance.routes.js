const express = require("express");
const router = express.Router();

// 1. Imports (Bina destructuring ke, taaki object ya function dono handle ho jayein)
const controller = require("../../controllers/student/studentScanAttendance.controller");
const auth = require("../../middleware/authMiddleware");
const role = require("../../middleware/role.middleware");

// 2. Smart Extraction (Agar object hai toh andar se function nikalega, warna direct use karega)
const scanAttendance = controller.scanAttendance || controller;
const authMiddleware = auth.authMiddleware || auth;
const roleMiddleware = role.roleMiddleware || role;

// 3. Route Definition
router.post(
  "/scan", 
  authMiddleware,               // Token verify
  roleMiddleware("student"),    // Role check
  scanAttendance                // Main logic
);

module.exports = router;