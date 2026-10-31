const mongoose = require("mongoose");

const Notification = require("../../models/Notification");

const ALLOWED_TYPES = [
  "attendance",
  "subject",
  "announcement",
  "grievance",
  "system",
  "general",
];

// Validate MongoDB ObjectId
const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${fieldName}.`);
    error.statusCode = 400;
    throw error;
  }
};

// Get all notifications for a student
const getMyNotifications = async ({
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
  type,
}) => {
  validateObjectId(userId, "user ID");

  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    const error = new Error("Page must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    const error = new Error(
      "Limit must be an integer between 1 and 100."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    unreadOnly !== undefined &&
    typeof unreadOnly !== "boolean"
  ) {
    const error = new Error("Invalid unreadOnly value.");
    error.statusCode = 400;
    throw error;
  }

  const filter = {
    user: userId,
  };

  if (unreadOnly) {
    filter.isRead = false;
  }

  if (type) {
    if (!ALLOWED_TYPES.includes(type)) {
      const error = new Error("Invalid notification type.");
      error.statusCode = 400;
      throw error;
    }

    filter.type = type;
  }

  const skip = (page - 1) * limit;

  const [
    notifications,
    totalNotifications,
    unreadCount,
  ] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName role")
      .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      user: userId,
      isRead: false,
    }),
  ]);

  return {
    notifications,

    unreadCount,

    pagination: {
      page,
      limit,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
    },
  };
};

// Get unread notification count
const getUnreadCount = async ({ userId }) => {
  validateObjectId(userId, "user ID");

  const unreadCount = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  return {
    unreadCount,
  };
};

// Mark one notification as read
const markAsRead = async ({
  userId,
  notificationId,
}) => {
  validateObjectId(userId, "user ID");
  validateObjectId(notificationId, "notification ID");

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!notification) {
    const error = new Error(
      "Notification not found or you do not have permission to access it."
    );

    error.statusCode = 404;
    throw error;
  }

  return notification;
};

// Mark all unread notifications as read
const markAllAsRead = async ({ userId }) => {
  validateObjectId(userId, "user ID");

  const result = await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
    message: "All notifications marked as read.",
  };
};

// Delete one notification
const deleteNotification = async ({
  userId,
  notificationId,
}) => {
  validateObjectId(userId, "user ID");
  validateObjectId(notificationId, "notification ID");

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    const error = new Error(
      "Notification not found or you do not have permission to delete it."
    );

    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Notification deleted successfully.",
    notificationId,
  };
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};