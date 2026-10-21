
const adminAttendanceService = require("../../services/Admin/adminAttendance.service");


// GET ATTENDANCE SESSIONS
const getAttendanceSessions = async (req, res, next) => {
    try {
        const {
            facultyId,
            course,
            branch,
            semester,
            subjectId,
            fromDate,
            toDate
        } = req.query;

        const result = await adminAttendanceService.getAttendanceSessions({
            facultyId,
            course,
            branch,
            semester,
            subjectId,
            fromDate,
            toDate,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            message: "Attendance sessions fetched successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// GET ONE SESSION DETAILS
const getAttendanceSessionDetails = async (req, res, next) => {
    try {
        const result = await adminAttendanceService.getAttendanceSessionDetails({
            sessionId: req.params.id,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            message: "Attendance session details fetched successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAttendanceSessions,
    getAttendanceSessionDetails
};