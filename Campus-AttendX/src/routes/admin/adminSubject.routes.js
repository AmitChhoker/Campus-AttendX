const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getAllSubjects,
    getSubjectById,
    approveSubject,
    rejectSubject
} = require("../../controllers/admin/adminSubject.controller");


// Get all subjects
// Example:
// GET /api/admin/subjects?status=pending
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getAllSubjects
);


// Get one subject
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getSubjectById
);


// Approve
router.patch(
    "/:id/approve",
    authMiddleware,
    roleMiddleware("admin"),
    approveSubject
);


// Reject
router.patch(
    "/:id/reject",
    authMiddleware,
    roleMiddleware("admin"),
    rejectSubject
);


module.exports = router;