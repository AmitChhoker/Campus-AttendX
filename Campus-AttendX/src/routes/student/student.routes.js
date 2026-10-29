const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware"); // Path check kar lein (2 step piche)
const role = require("../../middleware/role.middleware");
const ctrl = require("../../controllers/student/studentAttendance.controller"); // Naya controller

router.use(auth, role("student"));

// Previous Semesters ka data lene ka route
router.get("/previous-semesters", ctrl.getPreviousSemesters);
router.get("/subject/:id", ctrl.getSubjectDetails);
router.put("/profile", ctrl.updateProfile);

module.exports = router;