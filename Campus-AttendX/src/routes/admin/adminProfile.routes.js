const express = require("express");
const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getAdminProfile
} = require("../../controllers/admin/adminProfile.controller");

// GET /api/admin/profile
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminProfile
);

module.exports = router;