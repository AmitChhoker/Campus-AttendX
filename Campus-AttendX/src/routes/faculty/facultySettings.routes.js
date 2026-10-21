const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getMyProfile,
    changePassword,
    logout
} = require("../../controllers/faculty/facultySettings.controller");


// =====================================================
// GET FACULTY PROFILE
// =====================================================

router.get(
    "/profile",
    authMiddleware,
    roleMiddleware("faculty"),
    getMyProfile
);


// =====================================================
// CHANGE PASSWORD
// =====================================================

router.patch(
    "/change-password",
    authMiddleware,
    roleMiddleware("faculty"),
    changePassword
);


// =====================================================
// LOGOUT
// =====================================================

router.post(
    "/logout",
    authMiddleware,
    roleMiddleware("faculty"),
    logout
);


module.exports = router;