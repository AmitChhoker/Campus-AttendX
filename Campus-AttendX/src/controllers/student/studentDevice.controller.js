const studentDeviceService = require("../../services/student/studentDevice.service");

const bindDevice = async (req, res, next) => {
  try {
    const { deviceId, deviceKey } = req.body || {};

    if (!deviceId || !deviceKey) {
      return res.status(400).json({
        success: false,
        message: "deviceId and deviceKey are required."
      });
    }

    const result = await studentDeviceService.bindDevice({
      studentId: req.user.id,
      deviceId,
      deviceKey
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyBound
        ? "Device already bound."
        : "Device bound successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { bindDevice };