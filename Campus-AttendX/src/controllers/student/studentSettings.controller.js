const studentSettingsService = require(
  "../../services/student/studentSettings.service"
);

// GET /api/student/settings/profile
const getMyProfile = async (req, res, next) => {
  try {
    const data = await studentSettingsService.getMyProfile({
      studentId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Student profile fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/student/settings/change-password
const changePassword = async (req, res, next) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    const token =
      studentSettingsService.getTokenFromRequest(req);

    const data = await studentSettingsService.changePassword({
      studentId: req.user.id,
      currentPassword,
      newPassword,
      confirmPassword,
      token,
    });

    // Remove the authentication cookie after invalidating the token.
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: data.message,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/settings/logout
const logout = async (req, res, next) => {
  try {
    const token =
      studentSettingsService.getTokenFromRequest(req);

    const data = await studentSettingsService.logout({
      token,
    });

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: data.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  changePassword,
  logout,
};