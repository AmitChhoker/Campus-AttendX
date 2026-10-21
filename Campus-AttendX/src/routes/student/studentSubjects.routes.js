const express = require("express");

const authMiddleware = require(
    "../../middleware/authMiddleware"
);

const roleMiddleware = require(
    "../../middleware/role.middleware"
);

const {
    getMySubjects,
    getMySubjectById,
    downloadSyllabus
} = require(
    "../../controllers/student/studentSubjects.controller"
);

const router = express.Router();

// =====================================================
// STUDENT SUBJECT ROUTES
// =====================================================

// 1. Get subject list.
// Optional query parameter: semester

router.get(
    "/",
    authMiddleware,
    roleMiddleware("student"),
    getMySubjects
);

// 2. Download a subject's syllabus.

router.get(
    "/:subjectId/syllabus",
    authMiddleware,
    roleMiddleware("student"),
    downloadSyllabus
);

// 3. Get details of one subject.

router.get(
    "/:subjectId",
    authMiddleware,
    roleMiddleware("student"),
    getMySubjectById
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;