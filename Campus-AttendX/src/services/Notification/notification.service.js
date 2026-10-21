const mongoose = require("mongoose");
const Notification = require("../../models/Notification");

const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  priority = "normal",
  actionUrl = null,
  relatedId = null,
  createdBy = null,
}) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("A valid recipient user ID is required.");
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new Error("Notification title is required.");
  }

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error("Notification message is required.");
  }

  const notification = await Notification.create({
    user: userId,
    title: title.trim(),
    message: message.trim(),
    type,
    priority,
    actionUrl,
    relatedId,
    createdBy,
  });

  return notification;
};

module.exports = {
  createNotification,
};