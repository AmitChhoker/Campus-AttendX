const Subject = require("../../models/Subject");
const User = require("../../models/User");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");


// =====================================================
// ADMIN BRANCH SCOPE HELPER
// =====================================================

const getBranchFilter = (adminBranch) => {

    // Super admin
    if (adminBranch === "ALL") {
        return {};
    }

    // Branch admin
    if (!adminBranch) {
        throw new Error("Admin branch is not configured");
    }

    return {
        branch: adminBranch
    };
};


// =====================================================
// GET ADMIN DASHBOARD
// =====================================================

const getDashboard = async ({
    adminBranch
}) => {

    // ---------------------------------------------
    // Validate admin branch
    // ---------------------------------------------

    if (!adminBranch) {
        throw new Error(
            "Admin branch is not configured"
        );
    }


    // ---------------------------------------------
    // Branch filter
    // ---------------------------------------------

    const branchFilter =
        getBranchFilter(adminBranch);


    // =================================================
    // DATE RANGE - TODAY
    // =================================================

    const startOfDay = new Date();

    startOfDay.setHours(
        0,
        0,
        0,
        0
    );


    const endOfDay = new Date();

    endOfDay.setHours(
        23,
        59,
        59,
        999
    );


    // =================================================
    // GET SUBJECTS FOR ADMIN BRANCH
    // =================================================

    const subjectFilter = {
        ...branchFilter
    };


    const subjects =
        await Subject.find(subjectFilter)
            .select(
                "_id subjectName subjectCode course branch semester status isActive createdAt"
            )
            .lean();


    const subjectIds =
        subjects.map(
            subject => subject._id
        );


    // =================================================
    // USER FILTERS
    // =================================================

    const studentFilter = {
        role: "student",
        ...branchFilter
    };


    const facultyFilter = {
        role: "faculty",
        ...branchFilter
    };


    // =================================================
    // USER COUNTS
    // =================================================

    const [

        totalStudents,

        activeStudents,

        inactiveStudents,

        totalFaculty,

        activeFaculty,

        inactiveFaculty

    ] = await Promise.all([

        User.countDocuments(
            studentFilter
        ),

        User.countDocuments({
            ...studentFilter,
            isActive: true
        }),

        User.countDocuments({
            ...studentFilter,
            isActive: false
        }),

        User.countDocuments(
            facultyFilter
        ),

        User.countDocuments({
            ...facultyFilter,
            isActive: true
        }),

        User.countDocuments({
            ...facultyFilter,
            isActive: false
        })

    ]);


    // =================================================
    // SUBJECT COUNTS
    // =================================================

    const [

        totalSubjects,

        approvedSubjects,

        pendingSubjects,

        rejectedSubjects,

        activeSubjects

    ] = await Promise.all([

        Subject.countDocuments(
            subjectFilter
        ),

        Subject.countDocuments({
            ...subjectFilter,
            status: "approved"
        }),

        Subject.countDocuments({
            ...subjectFilter,
            status: "pending"
        }),

        Subject.countDocuments({
            ...subjectFilter,
            status: "rejected"
        }),

        Subject.countDocuments({
            ...subjectFilter,
            isActive: true
        })

    ]);


    // =================================================
    // TODAY'S ATTENDANCE SESSIONS
    // =================================================

    let todaySessions = [];


    if (subjectIds.length > 0) {

        todaySessions =
            await AttendanceSession.find({

                subject: {
                    $in: subjectIds
                },

                startedAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }

            })

            .populate(
                "faculty",
                "firstName lastName emailId"
            )

            .populate(
                "subject",
                "subjectName subjectCode course branch semester"
            )

            .sort({
                startedAt: -1
            })

            .lean();

    }


    // =================================================
    // TODAY'S ATTENDANCE CALCULATION
    // =================================================

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayTotalStudents = 0;


    for (
        const session
        of todaySessions
    ) {

        if (!session.subject) {
            continue;
        }


        // ---------------------------------------------
        // Students eligible for this subject
        // ---------------------------------------------

        const totalStudents =
            await User.countDocuments({

                role: "student",

                isActive: true,

                course:
                    session.subject.course,

                branch:
                    session.subject.branch,

                semester:
                    session.subject.semester

            });


        // ---------------------------------------------
        // Present students
        // ---------------------------------------------

        const present =
            await Attendance.countDocuments({

                session: session._id,

                status: "present"

            });


        const absent =
            Math.max(
                totalStudents - present,
                0
            );


        todayTotalStudents +=
            totalStudents;

        todayPresent +=
            present;

        todayAbsent +=
            absent;

    }


    // =================================================
    // TODAY'S ATTENDANCE PERCENTAGE
    // =================================================

    const todayAttendancePercentage =
        todayTotalStudents > 0

            ? Number(
                (
                    (
                        todayPresent /
                        todayTotalStudents
                    ) * 100
                ).toFixed(2)
            )

            : 0;


    // =================================================
    // RECENT ATTENDANCE SESSIONS
    // =================================================

    const recentSessions =
        await AttendanceSession.find(

            subjectIds.length > 0

                ? {
                    subject: {
                        $in: subjectIds
                    }
                }

                : {
                    _id: {
                        $in: []
                    }
                }

        )

        .populate(
            "faculty",
            "firstName lastName emailId"
        )

        .populate(
            "subject",
            "subjectName subjectCode course branch semester"
        )

        .sort({
            startedAt: -1
        })

        .limit(5)

        .lean();


    // =================================================
    // RECENT SUBJECT SUBMISSIONS
    // =================================================

    const recentSubjects =
        await Subject.find(
            subjectFilter
        )

        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )

        .sort({
            createdAt: -1
        })

        .limit(5)

        .lean();


    // =================================================
    // FORMAT RECENT SESSIONS
    // =================================================

    const formattedRecentSessions =
        recentSessions.map(
            session => ({

                sessionId:
                    session._id,

                sessionCode:
                    session.sessionCode,

                faculty:
                    session.faculty
                        ? {
                            id:
                                session.faculty._id,

                            name:
                                `${session.faculty.firstName} ${session.faculty.lastName}`,

                            email:
                                session.faculty.emailId
                        }

                        : null,

                subject:
                    session.subject
                        ? {
                            id:
                                session.subject._id,

                            name:
                                session.subject.subjectName,

                            code:
                                session.subject.subjectCode,

                            course:
                                session.subject.course,

                            branch:
                                session.subject.branch,

                            semester:
                                session.subject.semester
                        }

                        : null,

                startedAt:
                    session.startedAt,

                expiresAt:
                    session.expiresAt,

                closedAt:
                    session.closedAt,

                status:
                    session.status

            })
        );


    // =================================================
    // FORMAT RECENT SUBJECTS
    // =================================================

    const formattedRecentSubjects =
        recentSubjects.map(
            subject => ({

                id:
                    subject._id,

                subjectName:
                    subject.subjectName,

                subjectCode:
                    subject.subjectCode,

                course:
                    subject.course,

                branch:
                    subject.branch,

                semester:
                    subject.semester,

                status:
                    subject.status,

                isActive:
                    subject.isActive,

                submittedBy:
                    subject.submittedBy
                        ? {
                            id:
                                subject.submittedBy._id,

                            name:
                                `${subject.submittedBy.firstName} ${subject.submittedBy.lastName}`,

                            email:
                                subject.submittedBy.emailId
                        }

                        : null,

                createdAt:
                    subject.createdAt

            })
        );


    // =================================================
    // FINAL DASHBOARD RESPONSE
    // =================================================

    return {

        adminScope: {

            branch:
                adminBranch

        },


        // ---------------------------------------------
        // OVERVIEW
        // ---------------------------------------------

        overview: {

            totalStudents,

            totalFaculty,

            totalSubjects,

            activeSubjects,

            todaySessions:
                todaySessions.length

        },


        // ---------------------------------------------
        // USERS
        // ---------------------------------------------

        users: {

            students: {

                total:
                    totalStudents,

                active:
                    activeStudents,

                inactive:
                    inactiveStudents

            },

            faculty: {

                total:
                    totalFaculty,

                active:
                    activeFaculty,

                inactive:
                    inactiveFaculty

            }

        },


        // ---------------------------------------------
        // SUBJECTS
        // ---------------------------------------------

        subjects: {

            total:
                totalSubjects,

            approved:
                approvedSubjects,

            pending:
                pendingSubjects,

            rejected:
                rejectedSubjects,

            active:
                activeSubjects

        },


        // ---------------------------------------------
        // TODAY'S ATTENDANCE
        // ---------------------------------------------

        todayAttendance: {

            sessions:
                todaySessions.length,

            totalStudents:
                todayTotalStudents,

            present:
                todayPresent,

            absent:
                todayAbsent,

            attendancePercentage:
                todayAttendancePercentage

        },


        // ---------------------------------------------
        // RECENT SESSIONS
        // ---------------------------------------------

        recentSessions:
            formattedRecentSessions,


        // ---------------------------------------------
        // RECENT SUBJECT SUBMISSIONS
        // ---------------------------------------------

        recentSubjects:
            formattedRecentSubjects

    };

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getDashboard

};