const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

const { 
    createSubject, 
    getMySubjects, 
    getMySubjectById, 
    resubmitSubject, 
    deleteSubject 
} = require("../../controllers/faculty/subject.controller");

// ==========================================
// FACULTY SUBJECT ROUTES
// ==========================================

// Create new subject (Upload Syllabus)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    upload.single("syllabus"),
    createSubject
);

// Get all submitted subjects
router.get(
    "/my-submissions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySubjects
);

// Get single subject by ID
router.get(
    "/my-submissions/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySubjectById
);

// Resubmit a rejected/pending subject
router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    upload.single("syllabus"),
    resubmitSubject
);

// Delete a subject (WITH CASCADE DELETE)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    deleteSubject
);

module.exports = router;