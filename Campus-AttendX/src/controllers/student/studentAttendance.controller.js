const studentAttendanceService = require("../../services/Student/studentAttendance.service");

// =====================================================
// GET MY ATTENDANCE
// =====================================================

const getMyAttendance = async (req, res, next) => {
    try {

        // The student ID comes from the authenticated JWT.
        // Never accept studentId from the query string for this endpoint.

        const studentId = req.user.id;

        const {
            semester,
            month,
            year,
            subjectId,
            startDate,
            endDate
        } = req.query;

        const attendanceData =
            await studentAttendanceService.getMyAttendance({
                studentId,
                semester,
                month,
                year,
                subjectId,
                startDate,
                endDate
            });

        return res.status(200).json({
            success: true,

            message:
                "Student attendance fetched successfully",

            data: attendanceData
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getMyAttendance
};