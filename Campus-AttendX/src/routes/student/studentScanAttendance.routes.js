const express = require("express");
const router = express.Router();

// 🔥 Sahi Paths (Apne folder names ke hisaab se check kar lena)
const { scanAttendance } = require("../../controllers/student/studentScanAttendance.controller");
const authMiddleware = require("../../middleware/authMiddleware"); 
const roleMiddleware = require("../../middleware/role.middleware");

// Middleware check
router.use(authMiddleware, roleMiddleware("student"));

// Route definition
router.post("/scan", scanAttendance);

module.exports = router;