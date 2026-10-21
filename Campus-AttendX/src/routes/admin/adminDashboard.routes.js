const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getDashboard
} = require(
    "../../controllers/admin/adminDashboard.controller"
);


// =====================================================
// GET ADMIN DASHBOARD
// =====================================================

router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getDashboard
);


module.exports = router;