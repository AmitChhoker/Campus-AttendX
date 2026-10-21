const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");


const {

    getAttendanceSessions,

    getAttendanceSessionDetails

} =
    require("../../controllers/admin/adminAttendance.controller");


// =====================================================
// GET ATTENDANCE SESSION HISTORY
//
// Example:
// GET /api/admin/attendance/sessions
//
// Filters:
// facultyId
// course
// branch
// semester
// subjectId
// fromDate
// toDate
// =====================================================

router.get(

    "/sessions",

    authMiddleware,

    roleMiddleware("admin"),

    getAttendanceSessions

);


// =====================================================
// GET ONE ATTENDANCE SESSION DETAILS
// =====================================================

router.get(

    "/sessions/:id",

    authMiddleware,

    roleMiddleware("admin"),

    getAttendanceSessionDetails

);


module.exports = router;