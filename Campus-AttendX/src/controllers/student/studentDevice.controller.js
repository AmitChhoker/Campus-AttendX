const User = require("../../models/User");

const bindDevice = async (req, res) => {
  try {
    const { deviceId, deviceKey } = req.body;
    const studentId = req.user?.id || req.user?._id || req.user?.userId;

    if (!deviceId || !deviceKey) {
      return res.status(400).json({ success: false, message: "Device info missing" });
    }

    // 🔥 SEAMLESS FIX: Overwrite the old device binding with the new one.
    // Jis bhi device se login karega, wahi uska naya trusted device ban jayega.
    const user = await User.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "deviceBinding.deviceId": deviceId,
          "deviceBinding.deviceKey": deviceKey,
          "deviceBinding.boundAt": new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Device bound successfully",
      data: user.deviceBinding
    });
  } catch (error) {
    console.error("Bind Device Error:", error);
    return res.status(500).json({ success: false, message: "Server error during device binding" });
  }
};

module.exports = { bindDevice };