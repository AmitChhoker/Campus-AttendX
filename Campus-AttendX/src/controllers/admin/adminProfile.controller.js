
const adminProfileService = require("../../services/Admin/adminProfile.service");


/**
 * GET /api/admin/profile
 *
 * Fetch the authenticated administrator's profile.
 */
const getAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    const profile = await adminProfileService.getAdminProfile({
      adminId
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};


/**
 * PATCH /api/admin/profile
 *
 * Update the authenticated administrator's personal information.
 */
const updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const updates = req.body;

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile data"
      });
    }

    const profile = await adminProfileService.updateAdminProfile({
      adminId,
      updates
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAdminProfile,
  updateAdminProfile
};