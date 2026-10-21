const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

const {
    bindDevice
} = require("../../controllers/student/studentDevice.controller");

router.post(
    "/bind",
    authMiddleware,
    roleMiddleware("student"),
    bindDevice
);

module.exports = router;