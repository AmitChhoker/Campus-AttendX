const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");
const redisClient = require("../../config/redis");

// Extract JWT from the existing authentication cookie
// or Authorization header.
const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }

  return null;
};

// Invalidate the current JWT using Redis.
//
// IMPORTANT:
// Use the same Redis key prefix that your authMiddleware
// checks when validating a token.
const blacklistToken = async (token) => {
  if (!token) {
    return;
  }

  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    const error = new Error("Invalid or expired authentication token.");
    error.statusCode = 401;
    throw error;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const remainingSeconds = decoded.exp - currentTime;

  if (remainingSeconds <= 0) {
    return;
  }

  // This key must match the blacklist key used by authMiddleware.
  await redisClient.set(
    `blacklist:${token}`,
    "Blocked",
    {
      EX: remainingSeconds,
    }
  );
};

// GET MY PROFILE
const getMyProfile = async ({ studentId }) => {
  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isActive: true,
  }).select(
    "firstName lastName emailId phone registrationNumber department course branch batch semester profileImage createdAt"
  );

  if (!student) {
    const error = new Error("Student profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    personalInformation: {
      firstName: student.firstName,
      lastName: student.lastName,
      emailId: student.emailId,
      phone: student.phone,
      profileImage: student.profileImage,
    },

    academicInformation: {
      registrationNumber: student.registrationNumber,
      department: student.department,
      course: student.course,
      branch: student.branch,
      batch: student.batch,
      semester: student.semester,
    },

    accountInformation: {
      accountCreatedAt: student.createdAt,
    },
  };
};

// CHANGE PASSWORD
const changePassword = async ({
  studentId,
  currentPassword,
  newPassword,
  confirmPassword,
  token,
}) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    const error = new Error(
      "Current password, new password, and confirmation are required."
    );

    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error(
      "The new password must contain at least 8 characters."
    );

    error.statusCode = 400;
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error(
      "New password and confirmation password do not match."
    );

    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error(
      "The new password must differ from the current password."
    );

    error.statusCode = 400;
    throw error;
  }

  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isActive: true,
  }).select("+password");

  if (!student) {
    const error = new Error("Student account not found.");
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    student.password
  );

  if (!isPasswordCorrect) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  // Hash the new password
  student.password = await bcrypt.hash(newPassword, 12);

  await student.save();

  // Invalidate the current login token.
  // The student must log in again.
  await blacklistToken(token);

  return {
    message: "Password changed successfully. Please log in again.",
  };
};

// LOGOUT
const logout = async ({ token }) => {
  if (token) {
    await blacklistToken(token);
  }

  return {
    message: "Logged out successfully.",
  };
};

module.exports = {
  getTokenFromRequest,
  getMyProfile,
  changePassword,
  logout,
};