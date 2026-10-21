const adminAuditService = require("../../services/Admin/adminAudit.service");

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, fromDate, toDate, studentId, sessionId } = req.query;

    const result = await adminAuditService.getAuditLogs({
      adminBranch: req.user.adminBranch,
      page,
      limit,
      fromDate,
      toDate,
      studentId,
      sessionId
    });

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };