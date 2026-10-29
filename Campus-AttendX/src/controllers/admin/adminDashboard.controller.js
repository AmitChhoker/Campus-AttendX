const User = require("../../models/User");
const Subject = require("../../models/Subject");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");

const getDashboard = async (req, res, next) => {
    try {
        const adminBranch = req.user.adminBranch;
        const branchFilter = adminBranch === "ALL" ? {} : { branch: adminBranch };

        // SYSTEM OVERVIEW
        const totalStudents = await User.countDocuments({ role: "student", ...branchFilter });
        const totalTeachers = await User.countDocuments({ role: "faculty", ...branchFilter });
        const totalCourses = await Subject.countDocuments({ ...branchFilter, status: "approved" });
        const totalSessions = await AttendanceSession.countDocuments({});
        
        // Live sessions (currently active)
        const liveSessions = await AttendanceSession.countDocuments({ 
            status: "active", 
            expiresAt: { $gt: new Date() } 
        });

        // RECENT ACTIVITY (Fake logic for flow, you can wire this to your Audit Log)
        const recentActivity = [
            { type: "session", message: "Dr. Priya created session", time: "2m ago" },
            { type: "attendance", message: "45 students marked", time: "5m ago" },
            { type: "user", message: "New user registered", time: "12m ago" }
        ];

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    students: totalStudents,
                    teachers: totalTeachers,
                    courses: totalCourses,
                    sessions: totalSessions,
                    live: liveSessions
                },
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboard };