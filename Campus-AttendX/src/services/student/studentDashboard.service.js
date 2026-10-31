const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Attendance = require("../../models/Attendance");
const AttendanceSession = require("../../models/AttendanceSession");

// ==================================================
// Get Student Dashboard
// ==================================================

const getStudentDashboard = async ({
    studentId,
    month,
    year
}) => {

    // ==================================================
    // 1. Get Student Profile
    // ==================================================

    const student = await User.findOne({
        _id: studentId,
        role: "student",
        isActive: true
    }).select(
        "firstName lastName emailId registrationNumber department course branch batch semester profileImage"
    );

    if (!student) {
        throw new Error("Active student not found");
    }

    // ==================================================
    // 2. Determine Selected Month
    // ==================================================

    const now = new Date();

    const selectedMonth = month
        ? Number(month)
        : now.getUTCMonth() + 1;

    const selectedYear = year
        ? Number(year)
        : now.getUTCFullYear();

    // Validate month and year

    if (
        !Number.isInteger(selectedMonth) ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {
        throw new Error(
            "Invalid month. Month must be between 1 and 12."
        );
    }

    if (
        !Number.isInteger(selectedYear) ||
        selectedYear < 2000 ||
        selectedYear > 2100
    ) {
        throw new Error("Invalid year");
    }

    // UTC boundaries for the selected month

    const monthStart = new Date(
        Date.UTC(selectedYear, selectedMonth - 1, 1)
    );

    const nextMonthStart = new Date(
        Date.UTC(selectedYear, selectedMonth, 1)
    );

    // ==================================================
    // 3. Get Subjects Belonging to the Student
    // ==================================================

    const subjects = await Subject.find({
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        status: "approved",
        isActive: true
    }).select(
        "subjectName subjectCode course branch semester credits type"
    ).sort({
        subjectName: 1
    });

    // If the student has no approved subjects

    if (subjects.length === 0) {

        return {
            welcomeMessage: `Welcome back, ${student.firstName}!`,

            profile: {
                studentId: student._id,
                name: `${student.firstName} ${student.lastName}`,
                emailId: student.emailId,
                registrationNumber: student.registrationNumber,
                department: student.department,
                course: student.course,
                branch: student.branch,
                batch: student.batch,
                semester: student.semester,
                profileImage: student.profileImage
            },

            attendance: {
                totalClassesConducted: 0,
                classesAttended: 0,
                classesMissed: 0,
                attendancePercentage: 0
            },

            selectedMonth: {
                month: selectedMonth,
                year: selectedYear
            },

            subjectSummary: []
        };
    }

    // ==================================================
    // 4. Get Completed Attendance Sessions
    // ==================================================

    const subjectIds = subjects.map(
        subject => subject._id
    );

    /*
       Count sessions that have finished.

       A session is considered finished when:
       1. Its status is "closed".
       2. Its status is "expired".
       3. It is still marked "active", but its expiry
          time has already passed.

       Sessions that are still active and unexpired
       are not counted yet.
    */

    const sessions = await AttendanceSession.find({

        subject: {
            $in: subjectIds
        },

        startedAt: {
            $lt: now
        },

        $or: [
            {
                status: {
                    $in: ["closed", "expired"]
                }
            },
            {
                status: "active",
                expiresAt: {
                    $lte: now
                }
            }
        ]

    }).select(
        "_id subject startedAt expiresAt status"
    );

    // ==================================================
    // 5. Separate All-Time and Monthly Sessions
    // ==================================================

    const monthlySessions = sessions.filter(session => {

        const sessionDate = new Date(session.startedAt);

        return (
            sessionDate >= monthStart &&
            sessionDate < nextMonthStart
        );

    });

    // ==================================================
    // 6. Get Attendance Records
    // ==================================================

    const sessionIds = sessions.map(
        session => session._id
    );

    const attendanceRecords = sessionIds.length > 0
        ? await Attendance.find({

            student: student._id,

            session: {
                $in: sessionIds
            },

            status: "present"

        }).select(
            "session status markedAt"
        )
        : [];

    // ==================================================
    // 7. Create Set of Attended Session IDs
    // ==================================================

    const attendedSessionIds = new Set(
        attendanceRecords.map(record =>
            record.session.toString()
        )
    );

    // ==================================================
    // 8. Calculate Overall Attendance
    // ==================================================

    const totalClassesConducted = sessions.length;

    const classesAttended = attendanceRecords.length;

    const classesMissed = Math.max(
        0,
        totalClassesConducted - classesAttended
    );

    const attendancePercentage = totalClassesConducted > 0
        ? Number(
            (
                (classesAttended / totalClassesConducted) *
                100
            ).toFixed(2)
        )
        : 0;

    // ==================================================
    // 9. Calculate Monthly Subject-Wise Attendance
    // ==================================================

    const subjectSummary = subjects.map(subject => {

        // Get this subject's sessions for the selected month

        const subjectMonthlySessions = monthlySessions.filter(
            session =>
                session.subject.toString() ===
                subject._id.toString()
        );

        // Total classes conducted for this subject this month

        const monthlyTotalClasses =
            subjectMonthlySessions.length;

        // Classes attended by the student this month

        const monthlyClassesAttended =
            subjectMonthlySessions.filter(session =>
                attendedSessionIds.has(
                    session._id.toString()
                )
            ).length;

        // Classes missed this month

        const monthlyClassesMissed = Math.max(
            0,
            monthlyTotalClasses - monthlyClassesAttended
        );

        // Monthly attendance percentage

        const monthlyAttendancePercentage =
            monthlyTotalClasses > 0
                ? Number(
                    (
                        (monthlyClassesAttended /
                            monthlyTotalClasses) *
                        100
                    ).toFixed(2)
                )
                : 0;

        return {

            subjectId: subject._id,

            subjectName: subject.subjectName,

            subjectCode: subject.subjectCode,

            course: subject.course,

            branch: subject.branch,

            semester: subject.semester,

            credits: subject.credits,

            type: subject.type,

            month: selectedMonth,

            year: selectedYear,

            totalClassesConducted: monthlyTotalClasses,

            classesAttended: monthlyClassesAttended,

            classesMissed: monthlyClassesMissed,

            attendancePercentage: monthlyAttendancePercentage

        };

    });

    // ==================================================
    // 10. Return Dashboard Data
    // ==================================================

    return {

        welcomeMessage: `Welcome back, ${student.firstName}!`,

        profile: {

            studentId: student._id,

            name: `${student.firstName} ${student.lastName}`,

            emailId: student.emailId,

            registrationNumber: student.registrationNumber,

            department: student.department,

            course: student.course,

            branch: student.branch,

            batch: student.batch,

            semester: student.semester,

            profileImage: student.profileImage

        },

        attendance: {

            totalClassesConducted,

            classesAttended,

            classesMissed,

            attendancePercentage

        },

        selectedMonth: {

            month: selectedMonth,

            year: selectedYear

        },

        subjectSummary

    };

};

module.exports = {
    getStudentDashboard
};