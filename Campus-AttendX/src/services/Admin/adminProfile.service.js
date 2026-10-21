const User = require("../../models/User");

/**
 * Get the authenticated administrator's profile.
 */
const getAdminProfile = async ({ adminId }) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  })
    .select(
      "firstName lastName emailId phone role adminBranch isActive profileImage lastLogin createdAt updatedAt"
    )
    .lean();

  if (!admin) {
    const error = new Error("Admin profile not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    fullName: `${admin.firstName} ${admin.lastName}`,
    emailId: admin.emailId,
    phone: admin.phone,
    role: admin.role,
    adminBranch: admin.adminBranch,
    isActive: admin.isActive,
    profileImage: admin.profileImage,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt
  };
};


/**
 * Update permitted personal information.
 *
 * Editable fields:
 * firstName, lastName, emailId, phone
 */
const updateAdminProfile = async ({ adminId, updates }) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "emailId",
    "phone"
  ];

  const updateData = {};

  // Accept only explicitly permitted fields.
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      updateData[field] = updates[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    const error = new Error("No valid profile fields provided");
    error.statusCode = 400;
    throw error;
  }

  // Normalize and validate submitted values.
  if (updateData.firstName !== undefined) {
    if (typeof updateData.firstName !== "string") {
      const error = new Error("First name must be a string");
      error.statusCode = 400;
      throw error;
    }

    updateData.firstName = updateData.firstName.trim();

    if (
      updateData.firstName.length < 3 ||
      updateData.firstName.length > 20
    ) {
      const error = new Error(
        "First name must contain between 3 and 20 characters"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (updateData.lastName !== undefined) {
    if (typeof updateData.lastName !== "string") {
      const error = new Error("Last name must be a string");
      error.statusCode = 400;
      throw error;
    }

    updateData.lastName = updateData.lastName.trim();

    if (
      updateData.lastName.length < 1 ||
      updateData.lastName.length > 50
    ) {
      const error = new Error(
        "Last name must contain between 1 and 50 characters"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (updateData.emailId !== undefined) {
    if (typeof updateData.emailId !== "string") {
      const error = new Error("Email must be a string");
      error.statusCode = 400;
      throw error;
    }

    updateData.emailId = updateData.emailId.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(updateData.emailId)) {
      const error = new Error("Please provide a valid email address");
      error.statusCode = 400;
      throw error;
    }
  }

  if (updateData.phone !== undefined) {
    if (typeof updateData.phone !== "string") {
      const error = new Error("Phone number must be a string");
      error.statusCode = 400;
      throw error;
    }

    updateData.phone = updateData.phone.trim();

    // Adapt this validation if your application supports international numbers.
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!phoneRegex.test(updateData.phone)) {
      const error = new Error(
        "Please provide a valid phone number containing 10 to 15 digits"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Confirm the authenticated user is an administrator.
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    const error = new Error("Admin profile not found");
    error.statusCode = 404;
    throw error;
  }

  // Check email uniqueness if the email is changing.
  if (
    updateData.emailId !== undefined &&
    updateData.emailId !== admin.emailId
  ) {
    const existingEmail = await User.findOne({
      emailId: updateData.emailId,
      _id: { $ne: adminId }
    }).select("_id");

    if (existingEmail) {
      const error = new Error(
        "This email address is already registered"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  // Check phone uniqueness if the phone number is changing.
  if (
    updateData.phone !== undefined &&
    updateData.phone !== admin.phone
  ) {
    const existingPhone = await User.findOne({
      phone: updateData.phone,
      _id: { $ne: adminId }
    }).select("_id");

    if (existingPhone) {
      const error = new Error(
        "This phone number is already registered"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  // Update only permitted fields.
  Object.assign(admin, updateData);

  await admin.save();

  // Return only fields needed by the frontend.
  return {
    id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    fullName: `${admin.firstName} ${admin.lastName}`,
    emailId: admin.emailId,
    phone: admin.phone,
    role: admin.role,
    adminBranch: admin.adminBranch,
    isActive: admin.isActive,
    profileImage: admin.profileImage,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt
  };
};


module.exports = {
  getAdminProfile,
  updateAdminProfile
};