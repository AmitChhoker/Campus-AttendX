const AttendanceSession = require("../../models/AttendanceSession");
const Subject = require("../../models/Subject");
const User = require("../../models/User");
const Attendance = require("../../models/Attendance");


// =====================================================
// ADMIN BRANCH SCOPE HELPER
// =====================================================

const applyAdminBranchScope = (filter, adminBranch) => {

    // Super admin can access all branches
    if (adminBranch === "ALL") {
        return filter;
    }

    // Branch admin must have a configured branch
    if (!adminBranch) {
        throw new Error("Admin branch is not configured");
    }

    // Restrict subject branch
    filter["subject.branch"] = adminBranch;

    return filter;
};


// =====================================================
// GET ADMIN ATTENDANCE SESSIONS
// =====================================================

const getAttendanceSessions = async ({
    facultyId,
    course,
    branch,
    semester,
    subjectId,
    fromDate,
    toDate,
    adminBranch
}) => {

    // ---------------------------------------------
    // Validate admin branch
    // ---------------------------------------------

    if (!adminBranch) {
        throw new Error("Admin branch is not configured");
    }


    // ---------------------------------------------
    // Build session filter
    // ---------------------------------------------

    const sessionFilter = {};


    // ---------------------------------------------
    // Filter by faculty
    // ---------------------------------------------

    if (facultyId) {

        sessionFilter.faculty = facultyId;

    }


    // ---------------------------------------------
    // Filter by subject
    // ---------------------------------------------

    if (subjectId) {

        sessionFilter.subject = subjectId;

    }


    // ---------------------------------------------
    // Date filter
    // ---------------------------------------------

    if (fromDate || toDate) {

        sessionFilter.startedAt = {};

    }


    if (fromDate) {

        const startDate =
            new Date(fromDate);


        if (Number.isNaN(startDate.getTime())) {

            throw new Error(
                "Invalid fromDate"
            );

        }


        startDate.setHours(
            0,
            0,
            0,
            0
        );


        sessionFilter.startedAt.$gte =
            startDate;

    }


    if (toDate) {

        const endDate =
            new Date(toDate);


        if (Number.isNaN(endDate.getTime())) {

            throw new Error(
                "Invalid toDate"
            );

        }


        // Include complete "to" day
        endDate.setHours(
            23,
            59,
            59,
            999
        );


        sessionFilter.startedAt.$lte =
            endDate;

    }


    // ---------------------------------------------
    // Find sessions
    // ---------------------------------------------

    const sessions =
        await AttendanceSession.find(
            sessionFilter
        )

        .populate(
            "faculty",
            "firstName lastName emailId"
        )

        .populate(
            "subject",
            "subjectName subjectCode course branch semester credits type"
        )

        .sort({
            startedAt: -1
        });


    // ---------------------------------------------
    // Apply admin branch + other subject filters
    //
    // These fields belong to Subject.
    // ---------------------------------------------

    const filteredSessions =
        sessions.filter(session => {

            if (!session.subject) {

                return false;

            }


            // -----------------------------------------
            // ADMIN BRANCH SECURITY CHECK
            // -----------------------------------------

            if (
                adminBranch !== "ALL" &&
                session.subject.branch !== adminBranch
            ) {

                return false;

            }


            // -----------------------------------------
            // Optional course filter
            // -----------------------------------------

            if (
                course &&
                session.subject.course !== course
            ) {

                return false;

            }


            // -----------------------------------------
            // Optional branch filter
            // -----------------------------------------

            if (
                branch &&
                session.subject.branch !== branch
            ) {

                return false;

            }


            // -----------------------------------------
            // Optional semester filter
            // -----------------------------------------

            if (
                semester &&
                Number(session.subject.semester) !==
                Number(semester)
            ) {

                return false;

            }


            return true;

        });


    // ---------------------------------------------
    // Create detailed session response
    // ---------------------------------------------

    const sessionDetails =
        await Promise.all(

            filteredSessions.map(
                async (session) => {

                    const subject =
                        session.subject;


                    // ---------------------------------
                    // Find students belonging to subject
                    // ---------------------------------

                    const totalStudents =
                        await User.countDocuments({

                            role: "student",

                            isActive: true,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester

                        });


                    // ---------------------------------
                    // Find present students
                    // ---------------------------------

                    const present =
                        await Attendance.countDocuments({

                            session:
                                session._id,

                            status: "present"

                        });


                    const absent =
                        Math.max(
                            totalStudents - present,
                            0
                        );


                    const attendancePercentage =
                        totalStudents > 0

                            ? Number(
                                (
                                    (present /
                                        totalStudents) *
                                    100
                                ).toFixed(2)
                            )

                            : 0;


                    return {

                        sessionId:
                            session._id,

                        sessionCode:
                            session.sessionCode,


                        faculty: {

                            id:
                                session.faculty?._id,

                            name:
                                session.faculty

                                    ? `${session.faculty.firstName} ${session.faculty.lastName}`

                                    : "Unknown",

                            email:
                                session.faculty?.emailId

                        },


                        subject: {

                            id:
                                subject._id,

                            name:
                                subject.subjectName,

                            code:
                                subject.subjectCode,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester,

                            credits:
                                subject.credits,

                            type:
                                subject.type

                        },


                        startedAt:
                            session.startedAt,

                        expiresAt:
                            session.expiresAt,

                        closedAt:
                            session.closedAt,

                        status:
                            session.status,


                        attendance: {

                            totalStudents,

                            present,

                            absent,

                            attendancePercentage

                        }

                    };

                }

            )

        );


    return {

        totalSessions:
            sessionDetails.length,

        filters: {

            facultyId:
                facultyId || null,

            course:
                course || null,

            branch:
                adminBranch === "ALL"
                    ? branch || null
                    : adminBranch,

            semester:
                semester || null,

            subjectId:
                subjectId || null,

            fromDate:
                fromDate || null,

            toDate:
                toDate || null

        },

        sessions:
            sessionDetails

    };

};


// =====================================================
// GET ONE ATTENDANCE SESSION DETAILS
// =====================================================

const getAttendanceSessionDetails = async ({
    sessionId,
    adminBranch
}) => {

    // ---------------------------------------------
    // Validate admin branch
    // ---------------------------------------------

    if (!adminBranch) {
        throw new Error("Admin branch is not configured");
    }


    // ---------------------------------------------
    // Find session
    // ---------------------------------------------

    const session =
        await AttendanceSession.findById(
            sessionId
        )

        .populate(
            "faculty",
            "firstName lastName emailId"
        )

        .populate(
            "subject",
            "subjectName subjectCode course branch semester credits type"
        );


    if (!session) {

        throw new Error(
            "Attendance session not found"
        );

    }


    // ---------------------------------------------
    // SECURITY CHECK
    // ---------------------------------------------

    if (
        adminBranch !== "ALL" &&
        session.subject?.branch !== adminBranch
    ) {

        throw new Error(
            "Attendance session not found or access denied"
        );

    }


    const subject =
        session.subject;


    if (!subject) {

        throw new Error(
            "Subject associated with this session was not found"
        );

    }


    // ---------------------------------------------
    // Get all students
    // ---------------------------------------------

    const students =
        await User.find({

            role: "student",

            isActive: true,

            course:
                subject.course,

            branch:
                subject.branch,

            semester:
                subject.semester

        })

        .select(
            "firstName lastName registrationNumber"
        )

        .sort({
            registrationNumber: 1
        });


    // ---------------------------------------------
    // Get attendance records
    // ---------------------------------------------

    const attendanceRecords =
        await Attendance.find({

            session:
                session._id,

            status: "present"

        })

        .select(
            "student markedAt"
        );


    // ---------------------------------------------
    // Create attendance map
    // ---------------------------------------------

    const attendanceMap =
        new Map();


    for (
        const record
        of attendanceRecords
    ) {

        attendanceMap.set(

            record.student.toString(),

            record.markedAt

        );

    }


    // ---------------------------------------------
    // Create student attendance list
    // ---------------------------------------------

    const studentList =
        students.map(student => {

            const studentId =
                student._id.toString();


            const markedAt =
                attendanceMap.get(
                    studentId
                );


            return {

                studentId:
                    student._id,

                registrationNumber:
                    student.registrationNumber,

                name:
                    `${student.firstName} ${student.lastName}`,

                status:
                    markedAt
                        ? "present"
                        : "absent",

                markedAt:
                    markedAt || null

            };

        });


    const totalStudents =
        studentList.length;


    const present =
        studentList.filter(
            student =>
                student.status === "present"
        ).length;


    const absent =
        totalStudents - present;


    const attendancePercentage =
        totalStudents > 0

            ? Number(
                (
                    (present /
                        totalStudents) *
                    100
                ).toFixed(2)
            )

            : 0;


    return {

        session: {

            id:
                session._id,

            sessionCode:
                session.sessionCode,


            faculty: {

                id:
                    session.faculty?._id,

                name:
                    session.faculty

                        ? `${session.faculty.firstName} ${session.faculty.lastName}`

                        : "Unknown",

                email:
                    session.faculty?.emailId

            },


            subject: {

                id:
                    subject._id,

                name:
                    subject.subjectName,

                code:
                    subject.subjectCode,

                course:
                    subject.course,

                branch:
                    subject.branch,

                semester:
                    subject.semester,

                credits:
                    subject.credits,

                type:
                    subject.type

            },


            startedAt:
                session.startedAt,

            expiresAt:
                session.expiresAt,

            closedAt:
                session.closedAt,

            status:
                session.status

        },


        summary: {

            totalStudents,

            present,

            absent,

            attendancePercentage

        },


        students:
            studentList

    };

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAttendanceSessions,

    getAttendanceSessionDetails

};