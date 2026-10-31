const mongoose = require("mongoose");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Attendance = require("../../models/Attendance");
const AttendanceSession = require("../../models/AttendanceSession");

// =====================================================
// CONSTANTS
// =====================================================

const TIMEZONE_OFFSET_MINUTES = 330; // Asia/Kolkata: UTC+05:30

// =====================================================
// DATE HELPERS
// =====================================================

// Get the current date in India.
//
// We use Asia/Kolkata calendar dates for month/year selection,
// regardless of the server's timezone.

const getIndiaDateParts = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const result = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            result[part.type] = part.value;
        }
    }

    return {
        year: Number(result.year),
        month: Number(result.month),
        day: Number(result.day)
    };
};

// Convert an Indian local calendar date into a UTC Date.
//
// Example:
// 2026-10-01 00:00 IST
// becomes
// 2026-09-30T18:30:00.000Z

const indiaDateToUTC = (year, month, day) => {
    return new Date(
        Date.UTC(year, month - 1, day) -
        TIMEZONE_OFFSET_MINUTES * 60 * 1000
    );
};

// Return the beginning and end of a selected month.

const getMonthRange = (month, year) => {
    return {
        start: indiaDateToUTC(year, month, 1),

        end: indiaDateToUTC(
            month === 12 ? year + 1 : year,
            month === 12 ? 1 : month + 1,
            1
        )
    };
};

// Return the beginning and end of a selected Indian calendar date.

const getIndiaDayRange = (dateString) => {
    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        throw new Error(
            "Dates must use YYYY-MM-DD format"
        );
    }

    const [year, month, day] = dateString
        .split("-")
        .map(Number);

    const start = indiaDateToUTC(year, month, day);

    const end = indiaDateToUTC(year, month, day + 1);

    // Reject invalid dates such as 2026-02-31.

    const actual = getIndiaDateParts(start);

    if (
        actual.year !== year ||
        actual.month !== month ||
        actual.day !== day
    ) {
        throw new Error("Invalid date");
    }

    return { start, end };
};

// Validate a MongoDB ObjectId.

const validateObjectId = (id, fieldName) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// =====================================================
// ATTENDANCE CALCULATION HELPERS
// =====================================================

const calculatePercentage = (attended, conducted) => {
    if (conducted === 0) {
        return 0;
    }

    return Number(
        ((attended / conducted) * 100).toFixed(2)
    );
};

// Get the number of attended sessions from a set of session IDs.

const countAttendedSessions = (sessions, attendedSessionIds) => {
    let attended = 0;

    for (const session of sessions) {
        if (
            attendedSessionIds.has(
                session._id.toString()
            )
        ) {
            attended++;
        }
    }

    return attended;
};

// Calculate the attendance summary for a collection of sessions.

const calculateSummary = (
    sessions,
    attendedSessionIds
) => {
    const classesConducted = sessions.length;

    const classesAttended = countAttendedSessions(
        sessions,
        attendedSessionIds
    );

    const classesMissed =
        classesConducted - classesAttended;

    return {
        classesConducted,
        classesAttended,
        classesMissed,

        attendancePercentage: calculatePercentage(
            classesAttended,
            classesConducted
        )
    };
};

// =====================================================
// MAIN SERVICE
// =====================================================

const getMyAttendance = async ({
    studentId,
    semester,
    month,
    year,
    subjectId,
    startDate,
    endDate
}) => {

    // -------------------------------------------------
    // 1. Validate student ID
    // -------------------------------------------------

    validateObjectId(studentId, "student ID");

    // -------------------------------------------------
    // 2. Find the authenticated student
    // -------------------------------------------------

    const student = await User.findOne({
        _id: studentId,
        role: "student",
        isActive: true
    }).select(
        "firstName lastName emailId registrationNumber " +
        "course branch department semester batch"
    );

    if (!student) {
        throw new Error("Active student not found");
    }

    // -------------------------------------------------
    // 3. Determine selected semester
    // -------------------------------------------------

    const selectedSemester =
        semester === undefined || semester === ""
            ? student.semester
            : Number(semester);

    if (
        !Number.isInteger(selectedSemester) ||
        selectedSemester < 1 ||
        selectedSemester > 8
    ) {
        throw new Error(
            "Semester must be an integer between 1 and 8"
        );
    }

    // -------------------------------------------------
    // 4. Determine selected month and year
    // -------------------------------------------------

    const currentIndiaDate = getIndiaDateParts();

    const selectedMonth =
        month === undefined || month === ""
            ? currentIndiaDate.month
            : Number(month);

    const selectedYear =
        year === undefined || year === ""
            ? currentIndiaDate.year
            : Number(year);

    if (
        !Number.isInteger(selectedMonth) ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {
        throw new Error(
            "Month must be an integer between 1 and 12"
        );
    }

    if (
        !Number.isInteger(selectedYear) ||
        selectedYear < 2000 ||
        selectedYear > 2100
    ) {
        throw new Error(
            "Year must be an integer between 2000 and 2100"
        );
    }

    // -------------------------------------------------
    // 5. Validate optional subject filter
    // -------------------------------------------------

    if (subjectId) {
        validateObjectId(subjectId, "subject ID");
    }

    // -------------------------------------------------
    // 6. Validate optional date filters
    // -------------------------------------------------

    let startRange = null;
    let endRange = null;

    if (startDate) {
        startRange = getIndiaDayRange(startDate);
    }

    if (endDate) {
        endRange = getIndiaDayRange(endDate);
    }

    if (
        startRange &&
        endRange &&
        startRange.start > endRange.start
    ) {
        throw new Error(
            "startDate cannot be later than endDate"
        );
    }

    // -------------------------------------------------
    // 7. Find approved subjects for the selected semester
    // -------------------------------------------------

    const subjects = await Subject.find({
        course: student.course,
        branch: student.branch,
        semester: selectedSemester,
        status: "approved",
        isActive: true
    })
        .select(
            "subjectName subjectCode course branch semester credits type"
        )
        .sort({
            subjectName: 1
        })
        .lean();

    const subjectIds = subjects.map(
        subject => subject._id
    );

    // If the student has no approved subjects for this semester,
    // return a valid empty attendance response.

    if (subjects.length === 0) {
        return {
            student: {
                id: student._id,
                name:
                    `${student.firstName} ${student.lastName}`,
                registrationNumber:
                    student.registrationNumber,
                course: student.course,
                branch: student.branch,
                semester: student.semester,
                batch: student.batch
            },

            selectedSemester,

            selectedMonth: {
                month: selectedMonth,
                year: selectedYear
            },

            monthlyAttendance: calculateSummary([], new Set()),

            semesterAttendance: calculateSummary([], new Set()),

            subjectWiseAttendance: [],

            attendanceHistory: [],

            filters: {
                subjectId: subjectId || null,
                startDate: startDate || null,
                endDate: endDate || null
            }
        };
    }

    // -------------------------------------------------
    // 8. Find completed attendance sessions
    // -------------------------------------------------
    //
    // A session is considered completed when:
    //
    // - it has been closed, or
    // - it has expired, or
    // - its expiry time has passed.
    //
    // Active sessions whose expiry time is still in the future
    // are excluded.
    //
    // IMPORTANT:
    // This assumes closed/expired sessions represent actual
    // conducted classes. Add an explicit cancellation/conducted
    // field if your application supports cancelled classes.

    const now = new Date();

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
    })
        .populate(
            "subject",
            "subjectName subjectCode course branch semester"
        )
        .populate(
            "faculty",
            "firstName lastName"
        )
        .sort({
            startedAt: -1
        })
        .lean();

    // -------------------------------------------------
    // 9. Separate selected month's sessions
    // -------------------------------------------------

    const monthRange = getMonthRange(
        selectedMonth,
        selectedYear
    );

    const monthlySessions = sessions.filter(session => {
        const startedAt = new Date(session.startedAt);

        return (
            startedAt >= monthRange.start &&
            startedAt < monthRange.end
        );
    });

    // -------------------------------------------------
    // 10. Get attendance records for this student
    // -------------------------------------------------

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
        })
            .select("session markedAt status")
            .lean()
        : [];

    // Set makes checking whether a student attended
    // a session efficient.

    const attendedSessionIds = new Set(
        attendanceRecords.map(record =>
            record.session.toString()
        )
    );

    // -------------------------------------------------
    // 11. Calculate monthly overall attendance
    // -------------------------------------------------

    const monthlyAttendance = calculateSummary(
        monthlySessions,
        attendedSessionIds
    );

    // -------------------------------------------------
    // 12. Calculate semester overall attendance
    // -------------------------------------------------

    const semesterAttendance = calculateSummary(
        sessions,
        attendedSessionIds
    );

    // -------------------------------------------------
    // 13. Calculate monthly and semester subject summaries
    // -------------------------------------------------

    const subjectWiseAttendance = subjects.map(subject => {

        const subjectSessions = sessions.filter(session =>
            session.subject &&
            session.subject._id.toString() ===
                subject._id.toString()
        );

        const subjectMonthlySessions =
            subjectSessions.filter(session => {
                const startedAt = new Date(session.startedAt);

                return (
                    startedAt >= monthRange.start &&
                    startedAt < monthRange.end
                );
            });

        const monthlySummary = calculateSummary(
            subjectMonthlySessions,
            attendedSessionIds
        );

        const semesterSummary = calculateSummary(
            subjectSessions,
            attendedSessionIds
        );

        return {
            subject: {
                id: subject._id,
                name: subject.subjectName,
                code: subject.subjectCode,
                course: subject.course,
                branch: subject.branch,
                semester: subject.semester,
                credits: subject.credits,
                type: subject.type
            },

            monthly: monthlySummary,

            semester: semesterSummary
        };
    });

    // -------------------------------------------------
    // 14. Build attendance history
    // -------------------------------------------------

    // History starts with the selected month's sessions.
    // Optional startDate/endDate further narrow the history.
    // Optional subjectId narrows history to that subject.
    //
    // Overall and subject-wise summaries remain based on
    // the selected semester/month, not the history filters.

    let filteredHistorySessions = monthlySessions;

    if (subjectId) {
        filteredHistorySessions =
            filteredHistorySessions.filter(session =>
                session.subject &&
                session.subject._id.toString() === subjectId
            );
    }

    if (startRange) {
        filteredHistorySessions =
            filteredHistorySessions.filter(session =>
                new Date(session.startedAt) >= startRange.start
            );
    }

    if (endRange) {
        filteredHistorySessions =
            filteredHistorySessions.filter(session =>
                new Date(session.startedAt) < endRange.end
            );
    }

    // -------------------------------------------------
    // 15. Format history response
    // -------------------------------------------------

    const attendanceHistory = filteredHistorySessions.map(
        session => {

            const sessionId =
                session._id.toString();

            const attended =
                attendedSessionIds.has(sessionId);

            const facultyName = session.faculty
                ? `${session.faculty.firstName} ${session.faculty.lastName}`
                : null;

            const attendanceRecord = attendanceRecords.find(
                record =>
                    record.session.toString() === sessionId
            );

            return {
                sessionId: session._id,

                subject: session.subject
                    ? {
                        id: session.subject._id,
                        name: session.subject.subjectName,
                        code: session.subject.subjectCode,
                        semester: session.subject.semester
                    }
                    : null,

                faculty: facultyName,

                classDate: session.startedAt,

                sessionStatus: session.status,

                attendanceStatus: attended
                    ? "present"
                    : "absent",

                markedAt: attendanceRecord
                    ? attendanceRecord.markedAt
                    : null
            };
        }
    );

    // -------------------------------------------------
    // 16. Return complete response
    // -------------------------------------------------

    return {
        student: {
            id: student._id,

            name:
                `${student.firstName} ${student.lastName}`,

            registrationNumber:
                student.registrationNumber,

            course: student.course,

            branch: student.branch,

            department: student.department,

            currentSemester: student.semester,

            batch: student.batch
        },

        selectedSemester,

        selectedMonth: {
            month: selectedMonth,
            year: selectedYear
        },

        monthlyAttendance,

        semesterAttendance,

        subjectWiseAttendance,

        attendanceHistory,

        filters: {
            semester: selectedSemester,
            month: selectedMonth,
            year: selectedYear,
            subjectId: subjectId || null,
            startDate: startDate || null,
            endDate: endDate || null
        }
    };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getMyAttendance
};