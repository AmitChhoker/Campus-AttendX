const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

const {
    getAuditLogs
} = require("../../controllers/admin/adminAudit.controller");

router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getAuditLogs
);

module.exports = router;