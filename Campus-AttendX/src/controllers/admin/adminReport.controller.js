
const adminReportService = require("../../services/Admin/adminReport.service");


// =====================================================
// GET MONTHLY ATTENDANCE REPORT
// =====================================================

const getMonthlyAttendanceReport =
    async (req, res, next) => {

        try {

            const {

                month,

                year,

                course,

                branch,

                semester,

                subjectId

            } = req.query;


            const report =
                await adminReportService
                    .getMonthlyAttendanceReport({

                        month,

                        year,

                        course,

                        branch,

                        semester,

                        subjectId,

                        // Branch scope comes from
                        // authenticated admin
                        adminBranch:
                            req.user.adminBranch

                    });


            return res.status(200).json({

                success: true,

                message:
                    "Monthly attendance report fetched successfully",

                data:
                    report

            });

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET LOW ATTENDANCE REPORT
// =====================================================

const getLowAttendanceReport =
    async (req, res, next) => {

        try {

            const {

                month,

                year,

                course,

                branch,

                semester,

                subjectId,

                threshold

            } = req.query;


            const report =
                await adminReportService
                    .getLowAttendanceReport({

                        month,

                        year,

                        course,

                        branch,

                        semester,

                        subjectId,

                        threshold,

                        // Branch scope comes from
                        // authenticated admin
                        adminBranch:
                            req.user.adminBranch

                    });


            return res.status(200).json({

                success: true,

                message:
                    "Low attendance report fetched successfully",

                data:
                    report

            });

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// GET MONTHLY FACULTY ACTIVITY REPORT
// =====================================================

const getFacultyActivityReport =
    async (req, res, next) => {

        try {

            const {

                month,

                year,

                course,

                branch,

                semester,

                facultyId,

                subjectId

            } = req.query;


            const report =
                await adminReportService
                    .getFacultyActivityReport({

                        month,

                        year,

                        course,

                        branch,

                        semester,

                        facultyId,

                        subjectId,

                        // Branch scope comes from
                        // authenticated admin
                        adminBranch:
                            req.user.adminBranch

                    });


            return res.status(200).json({

                success: true,

                message:
                    "Monthly faculty activity report fetched successfully",

                data:
                    report

            });

        } catch (error) {

            next(error);

        }

    };


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getMonthlyAttendanceReport,

    getLowAttendanceReport,

    getFacultyActivityReport

};