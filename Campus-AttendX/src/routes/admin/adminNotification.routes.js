const express = require("express");

const router = express.Router();


// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");


// =====================================================
// CONTROLLER
// =====================================================

const {
    getAdminNotifications
} = require(
    "../../controllers/admin/adminNotification.controller"
);


// =====================================================
// GET ADMIN NOTIFICATIONS
// =====================================================

router.get(
    "/",

    authMiddleware,

    roleMiddleware("admin"),

    getAdminNotifications
);


// =====================================================
// EXPORTS
// =====================================================

module.exports = router;