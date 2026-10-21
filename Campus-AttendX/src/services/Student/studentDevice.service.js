// src/services/Student/studentDevice.service.js
const mongoose = require("mongoose");

const User = require("../../models/User");
const { generateDeviceKey } = require("../../utils/deviceBinding");

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const bindDevice = async ({ studentId, deviceId, deviceKey }) => {
  if (!mongoose.isValidObjectId(studentId)) {
    throw createError("Invalid student ID.", 400);
  }

  if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8) {
    throw createError("A valid deviceId is required.", 400);
  }

  if (
    !deviceKey ||
    typeof deviceKey !== "string" ||
    !/^[a-f0-9]{64}$/i.test(deviceKey)
  ) {
    throw createError(
      "A valid deviceKey is required (64 hex characters).",
      400
    );
  }

  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isActive: true
  }).select("+deviceBinding.deviceKey");

  if (!student) throw createError("Student account not found.", 404);

  const bound = student.deviceBinding?.deviceId;

  if (bound && bound === deviceId) {
    return {
      deviceId,
      boundAt: student.deviceBinding.boundAt || new Date(),
      alreadyBound: true
    };
  }

  if (bound && bound !== deviceId) {
    throw createError(
      "A different device is already bound to this account. Contact an admin to reset it.",
      409
    );
  }

  student.deviceBinding = {
    deviceId,
    deviceKey,
    boundAt: new Date()
  };

  await student.save();

  return {
    deviceId,
    boundAt: student.deviceBinding.boundAt,
    alreadyBound: false
  };
};

const resetDevice = async ({ userId, adminBranch }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID.", 400);
  }

  const filter = { _id: userId };
  if (adminBranch !== "ALL") {
    if (!adminBranch) {
      throw createError("Admin branch is not configured.", 400);
    }
    filter.branch = adminBranch;
  }

  const user = await User.findOne(filter);
  if (!user) {
    throw createError("User not found or access denied.", 404);
  }

  user.deviceBinding = {
    deviceId: null,
    deviceKey: null,
    boundAt: null
  };

  await user.save();

  return { reset: true, userId: user._id };
};

module.exports = {
  bindDevice,
  resetDevice,
  generateDeviceKey
};