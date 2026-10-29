const mongoose = require("mongoose");
const User = require("../../models/User");

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

  if (!deviceKey || typeof deviceKey !== "string" || !/^[a-f0-9]{64}$/i.test(deviceKey)) {
    throw createError("A valid deviceKey is required (64 hex characters).", 400);
  }

  const student = await User.findOne({ _id: studentId, role: "student", isActive: true });
  if (!student) throw createError("Student account not found.", 404);

  const bound = student.deviceBinding?.deviceId;

  if (bound && bound === deviceId) {
    return { deviceId, boundAt: student.deviceBinding.boundAt || new Date(), alreadyBound: true };
  }

  if (bound && bound !== deviceId) {
    throw createError("A different device is already bound to this account. Contact an admin to reset it.", 409);
  }

  // save() ki jagah updateOne use kar rahe hain taaki validation error na aaye
  await User.updateOne(
    { _id: studentId },
    {
      $set: {
        "deviceBinding.deviceId": deviceId,
        "deviceBinding.deviceKey": deviceKey,
        "deviceBinding.boundAt": new Date()
      }
    }
  );

  return { deviceId, boundAt: new Date(), alreadyBound: false };
};

const resetDevice = async ({ userId, adminBranch }) => {
  // ... (resetDevice ka code same rahega)
};

// 🔥 YE LINE SABSE ZAROORI HAI
module.exports = {
  bindDevice,
  resetDevice
};