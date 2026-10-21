const studentDashboardService = require("../../services/Student/studentDashboard.service");

// ==================================================
// Get Student Dashboard
// ==================================================

const getStudentDashboard = async (req, res, next) => {
    try {
        // 1. Get authenticated student's ID
        const studentId = req.user.id;

        // 2. Get optional month and year from query parameters
        const { month, year } = req.query;

        // 3. Fetch dashboard data from the service
        const dashboard =
            await studentDashboardService.getStudentDashboard({
                studentId,
                month,
                year
            });

        // 4. Send successful response
        return res.status(200).json({
            success: true,
            message: "Student dashboard fetched successfully",
            data: dashboard
        });

    } catch (error) {
        next(error);
    }
};

// ==================================================
// Export Controller
// ==================================================

module.exports = {
    getStudentDashboard
};