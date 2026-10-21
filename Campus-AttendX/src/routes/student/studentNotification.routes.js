const express = require("express");

const authMiddleware = require(
  "../../middleware/authMiddleware"
);

const roleMiddleware = require(
  "../../middleware/role.middleware"
);

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require(
  "../../controllers/student/studentNotification.controller"
);

const router = express.Router();

// All routes require an authenticated student
router.use(
  authMiddleware,
  roleMiddleware("student")
);

// GET /api/student/notifications
router.get("/", getMyNotifications);

// GET /api/student/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/student/notifications/read-all
router.patch("/read-all", markAllAsRead);

// PATCH /api/student/notifications/:notificationId/read
router.patch("/:notificationId/read", markAsRead);

// DELETE /api/student/notifications/:notificationId
router.delete("/:notificationId", deleteNotification);

module.exports = router;