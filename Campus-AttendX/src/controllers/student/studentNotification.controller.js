const studentNotificationService = require(
  "../../services/student/studentNotification.service"
);

// GET: All student notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly, type } = req.query;

    let parsedUnreadOnly = false;

    if (unreadOnly !== undefined) {
      if (
        unreadOnly !== "true" &&
        unreadOnly !== "false"
      ) {
        return res.status(400).json({
          success: false,
          message: "unreadOnly must be true or false.",
        });
      }

      parsedUnreadOnly = unreadOnly === "true";
    }

    const data =
      await studentNotificationService.getMyNotifications({
        userId: req.user.id,
        page: page === undefined ? 1 : Number(page),
        limit: limit === undefined ? 20 : Number(limit),
        unreadOnly: parsedUnreadOnly,
        type,
      });

    return res.status(200).json({
      success: true,
      message: "Student notifications fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET: Unread notification count
const getUnreadCount = async (req, res, next) => {
  try {
    const data =
      await studentNotificationService.getUnreadCount({
        userId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message: "Unread notification count fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark one notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification =
      await studentNotificationService.markAsRead({
        userId: req.user.id,
        notificationId,
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH: Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    const data =
      await studentNotificationService.markAllAsRead({
        userId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message: data.message,
      data: {
        modifiedCount: data.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Delete one notification
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const data =
      await studentNotificationService.deleteNotification({
        userId: req.user.id,
        notificationId,
      });

    return res.status(200).json({
      success: true,
      message: data.message,
      data: {
        notificationId: data.notificationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};