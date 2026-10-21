const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getMonthlyAttendanceReport,
    getLowAttendanceReport,
    getFacultyActivityReport
} = require(
    "../../controllers/admin/adminReport.controller"
);


// =====================================================
// MONTHLY ATTENDANCE REPORT
// =====================================================

router.get(
    "/monthly-attendance",

    authMiddleware,

    roleMiddleware("admin"),

    getMonthlyAttendanceReport
);


// =====================================================
// LOW ATTENDANCE REPORT
// =====================================================

router.get(
    "/low-attendance",

    authMiddleware,

    roleMiddleware("admin"),

    getLowAttendanceReport
);


// =====================================================
// MONTHLY FACULTY ACTIVITY REPORT
// =====================================================

router.get(
    "/faculty-activity",

    authMiddleware,

    roleMiddleware("admin"),

    getFacultyActivityReport
);


module.exports = router;