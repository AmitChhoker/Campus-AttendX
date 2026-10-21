const express = require("express");

const authMiddleware = require(
  "../../middleware/authMiddleware"
);

const roleMiddleware = require(
  "../../middleware/role.middleware"
);

const {
  getMyProfile,
  changePassword,
  logout,
} = require(
  "../../controllers/student/studentSettings.controller"
);

const router = express.Router();

// All settings endpoints require student authentication.
router.use(
  authMiddleware,
  roleMiddleware("student")
);

// Get personal and academic information
router.get("/profile", getMyProfile);

// Change password
router.patch("/change-password", changePassword);

// Logout
router.post("/logout", logout);

module.exports = router;