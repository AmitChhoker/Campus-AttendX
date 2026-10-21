const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

const {
    getStudentDashboard
} = require("../../controllers/student/studentDashboard.controller");

const router = express.Router();

// ==================================================
// GET Student Dashboard
// ==================================================
// URL: GET /api/student/dashboard
// Access: Authenticated students only
// ==================================================

router.get(
    "/",
    authMiddleware,
    roleMiddleware("student"),
    getStudentDashboard
);

module.exports = router;