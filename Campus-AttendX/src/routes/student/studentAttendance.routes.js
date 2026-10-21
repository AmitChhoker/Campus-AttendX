const express = require("express");

const authMiddleware = require(
    "../../middleware/authMiddleware"
);

const roleMiddleware = require(
    "../../middleware/role.middleware"
);

const {
    getMyAttendance
} = require(
    "../../controllers/student/studentAttendance.controller"
);

const router = express.Router();

// =====================================================
// STUDENT ATTENDANCE ROUTES
// =====================================================

// Get the authenticated student's attendance.
//
// Requires:
// 1. Valid authentication
// 2. Student role

router.get(
    "/",
    authMiddleware,
    roleMiddleware("student"),
    getMyAttendance
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;