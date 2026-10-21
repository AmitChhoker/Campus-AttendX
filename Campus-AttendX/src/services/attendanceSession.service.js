const crypto = require("crypto");

const AttendanceSession = require("../models/AttendanceSession");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const { generateBlePayload } = require("../utils/dynamicBle");

// ==========================================
// SESSION CONFIG
// ==========================================

const SESSION_DURATION = 5 * 60 * 1000;
const QR_DURATION = 30 * 1000; // matches dynamicQr.js window

// ==========================================
// CREATE ATTENDANCE SESSION
// ==========================================

const createAttendanceSession = async ({ facultyId, subjectId }) => {
    if (!subjectId || !/^[a-f\d]{24}$/i.test(String(subjectId))) {
        throw new Error("A valid subjectId is required");
    }

    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId,
        status: "approved",
        isActive: true
    });

    if (!subject) {
        throw new Error("Approved subject not found or you are not authorized");
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSession = await AttendanceSession.findOne({
        subject: subjectId,
        faculty: facultyId,
        createdAt: { $gte: oneHourAgo }
    });

    if (recentSession) {
        throw new Error("You already conducted attendance for this subject within the last hour");
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + SESSION_DURATION);

    const sessionCode = crypto.randomBytes(32).toString("hex");
    const bleSecret = crypto.randomBytes(32).toString("hex");

    const session = await AttendanceSession.create({
        subject: subject._id,
        faculty: facultyId,
        sessionCode,
        bleSecret,
        startedAt,
        expiresAt,
        status: "active"
    });

    return {
        session,
        qr: {
            expiresAt: new Date(startedAt.getTime() + QR_DURATION)
        }
    };
};

// ==========================================
// GET OWN SESSIONS
// ==========================================

const getMySessions = async (facultyId) => {
    return AttendanceSession.find({ faculty: facultyId })
        .populate("subject", "subjectName subjectCode course branch semester")
        .sort({ createdAt: -1 });
};

// ==========================================
// GET ONE SESSION
// ==========================================

const getAttendanceSessionById = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    }).populate("subject", "subjectName subjectCode course branch semester");

    if (!session) throw new Error("Attendance session not found");
    return session;
};

// ==========================================
// GET BLE PAYLOAD FOR ACTIVE SESSION
// ==========================================

const getSessionBlePayload = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    }).select("+bleSecret");

    if (!session) throw new Error("Attendance session not found");

    if (session.status !== "active") {
        throw new Error("Session is not active");
    }

    if (!session.bleSecret) {
        throw new Error("BLE secret not configured for this session (legacy session)");
    }

    return generateBlePayload(session._id, session.bleSecret);
};

// ==========================================
// CLOSE SESSION
// ==========================================

const closeAttendanceSession = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    });

    if (!session) throw new Error("Attendance session not found");
    if (session.status !== "active") {
        throw new Error("Attendance session is not active");
    }

    session.status = "closed";
    session.closedAt = new Date();
    await session.save();
    return session;
};

// ==========================================
// STUDENT MARKS ATTENDANCE (LEGACY)
// Kept for backward compatibility with older clients; new clients
// should use POST /api/student/scan-attendance/scan.
// ==========================================

const markAttendance = async ({ sessionId, studentId }) => {
    if (!/^[a-f\d]{24}$/i.test(String(sessionId))) {
        throw new Error("A valid attendance session ID is required");
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) throw new Error("Attendance session not found");

    const now = new Date();

    if (session.status !== "active" || now >= session.expiresAt) {
        if (session.status === "active" && now >= session.expiresAt) {
            session.status = "expired";
            await session.save();
        }
        throw new Error("Attendance session has expired");
    }

    const subject = await Subject.findById(session.subject);
    if (!subject || !subject.isActive || subject.status !== "approved") {
        throw new Error("The subject associated with this session is unavailable");
    }

    const student = await User.findOne({
        _id: studentId,
        role: "student",
        isActive: true
    });

    if (!student) throw new Error("Active student not found");

    if (
        student.course !== subject.course ||
        student.branch !== subject.branch ||
        student.semester !== subject.semester
    ) {
        throw new Error("You are not eligible for this subject");
    }

    const existing = await Attendance.findOne({
        session: sessionId,
        student: studentId
    });

    if (existing) throw new Error("Attendance already marked");

    return Attendance.create({
        session: sessionId,
        student: studentId,
        markedAt: now,
        status: "present",
        verification: {
            qrVerified: false,
            bleVerified: false,
            bleRssi: null,
            deviceVerified: false,
            deviceId: null,
            fingerprintVerified: false
        }
    });
};

// ==========================================
// FACULTY GETS ATTENDANCE SUMMARY
// ==========================================

const getAttendanceSummary = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    }).populate("subject", "subjectName subjectCode course branch semester");

    if (!session) throw new Error("Attendance session not found");

    const subject = session.subject;
    if (!subject) {
        throw new Error("Subject associated with this session was not found");
    }

    const students = await User.find({
        role: "student",
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester,
        isActive: true
    })
        .select("firstName lastName registrationNumber")
        .sort({ registrationNumber: 1 });

    const attendanceRecords = await Attendance.find({
        session: sessionId,
        status: "present"
    }).populate("student", "firstName lastName registrationNumber");

    const presentStudentIds = new Set(
        attendanceRecords
            .filter((r) => r.student)
            .map((r) => r.student._id.toString())
    );

    const presentStudents = [];
    const absentStudents = [];

    for (const student of students) {
        const data = {
            studentId: student._id,
            registrationNumber: student.registrationNumber,
            name: `${student.firstName} ${student.lastName}`
        };

        if (presentStudentIds.has(student._id.toString())) {
            presentStudents.push(data);
        } else {
            absentStudents.push(data);
        }
    }

    const totalStudents = students.length;
    const present = presentStudents.length;
    const absent = absentStudents.length;
    const attendancePercentage =
        totalStudents > 0 ? Number(((present / totalStudents) * 100).toFixed(2)) : 0;

    return {
        session: {
            id: session._id,
            subject: {
                id: subject._id,
                name: subject.subjectName,
                code: subject.subjectCode,
                course: subject.course,
                branch: subject.branch,
                semester: subject.semester
            },
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            status: session.status
        },
        summary: { totalStudents, present, absent, attendancePercentage },
        presentStudents,
        absentStudents
    };
};

// ==========================================
// DELETE A STUDENT'S ATTENDANCE (2-DAY WINDOW)
// ==========================================

const deleteAttendanceRecord = async ({ sessionId, studentId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    });

    if (!session) throw new Error("Attendance session not found");

    // 2-day window
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    if (new Date(session.startedAt) < twoDaysAgo) {
        throw new Error(
            "Attendance can only be deleted within 2 days of the session"
        );
    }

    const record = await Attendance.findOneAndDelete({
        session: sessionId,
        student: studentId
    });

    if (!record) throw new Error("Attendance record not found");

    return { removed: true, attendanceId: record._id };
};

// ==========================================
// MONTHLY REPORT
// ==========================================

const getMonthlyAttendanceReport = async ({ subjectId, facultyId, month, year }) => {
    const selectedMonth = Number(month);
    const selectedYear = Number(year);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
        throw new Error("Invalid month");
    }

    if (!Number.isInteger(selectedYear) || selectedYear < 2000 || selectedYear > currentYear) {
        throw new Error("Invalid year");
    }

    if (!subjectId || !/^[a-f\d]{24}$/i.test(String(subjectId))) {
        throw new Error("A valid subjectId is required");
    }

    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId,
        status: "approved",
        isActive: true
    });

    if (!subject) {
        throw new Error("Approved subject not found or you are not authorized");
    }

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 1);

    const now = new Date();

    if (startDate > now) throw new Error("Future month attendance report is not available");
    if (now < endDate) {
        throw new Error(
            "Monthly attendance report is available only after the selected month has been completed"
        );
    }

    const sessions = await AttendanceSession.find({
        subject: subject._id,
        faculty: facultyId,
        startedAt: { $gte: startDate, $lt: endDate }
    }).sort({ startedAt: 1 });

    const totalClassesConducted = sessions.length;

    const students = await User.find({
        role: "student",
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester,
        isActive: true
    })
        .select("firstName lastName registrationNumber")
        .sort({ registrationNumber: 1 });

    const subjectInfo = {
        id: subject._id,
        name: subject.subjectName,
        code: subject.subjectCode,
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester
    };

    if (totalClassesConducted === 0) {
        return {
            month: selectedMonth,
            year: selectedYear,
            subject: subjectInfo,
            totalClassesConducted: 0,
            totalStudents: students.length,
            studentsBelow75: 0,
            students: students.map((s) => ({
                studentId: s._id,
                name: `${s.firstName} ${s.lastName}`,
                registrationNumber: s.registrationNumber,
                classesConducted: 0,
                present: 0,
                absent: 0,
                attendancePercentage: null,
                below75: false
            }))
        };
    }

    const sessionIds = sessions.map((s) => s._id);

    const attendanceRecords = await Attendance.find({
        session: { $in: sessionIds },
        status: "present"
    });

    const attendanceCount = new Map();
    for (const r of attendanceRecords) {
        const sid = r.student.toString();
        attendanceCount.set(sid, (attendanceCount.get(sid) || 0) + 1);
    }

    const studentReports = students.map((s) => {
        const sid = s._id.toString();
        const present = attendanceCount.get(sid) || 0;
        const absent = totalClassesConducted - present;
        const percentage = Number(
            ((present / totalClassesConducted) * 100).toFixed(2)
        );

        return {
            studentId: s._id,
            name: `${s.firstName} ${s.lastName}`,
            registrationNumber: s.registrationNumber,
            classesConducted: totalClassesConducted,
            present,
            absent,
            attendancePercentage: percentage,
            below75: percentage < 75
        };
    });

    const studentsBelow75 = studentReports.filter((s) => s.below75).length;

    return {
        month: selectedMonth,
        year: selectedYear,
        subject: subjectInfo,
        totalClassesConducted,
        totalStudents: students.length,
        studentsBelow75,
        students: studentReports
    };
};

const downloadMonthlyAttendanceReport = async ({ subjectId, facultyId, month, year }) => {
    const report = await getMonthlyAttendanceReport({
        subjectId,
        facultyId,
        month,
        year
    });

    const rows = [
        [
            "Registration Number",
            "Student Name",
            "Total Classes",
            "Present",
            "Absent",
            "Attendance Percentage",
            "Below 75%"
        ]
    ];

    for (const s of report.students) {
        rows.push([
            s.registrationNumber,
            s.name,
            s.classesConducted,
            s.present,
            s.absent,
            s.attendancePercentage === null ? "N/A" : `${s.attendancePercentage}%`,
            s.below75 ? "YES" : "NO"
        ]);
    }

    const csv = rows
        .map((row) =>
            row
                .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                .join(",")
        )
        .join("\n");

    const fileName = `${report.subject.code}_${report.month}_${report.year}_attendance.csv`;

    return {
        buffer: Buffer.from(csv, "utf-8"),
        fileName,
        contentType: "text/csv; charset=utf-8"
    };
};

module.exports = {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    getSessionBlePayload,
    closeAttendanceSession,
    markAttendance,
    getAttendanceSummary,
    deleteAttendanceRecord,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport
};