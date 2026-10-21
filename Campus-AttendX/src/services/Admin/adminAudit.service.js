const mongoose = require("mongoose");

const Attendance = require("../../models/Attendance");
const AttendanceSession = require("../../models/AttendanceSession");
const Subject = require("../../models/Subject");
const User = require("../../models/User");

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getAuditLogs = async ({
  adminBranch,
  page = 1,
  limit = 50,
  fromDate,
  toDate,
  studentId,
  sessionId
}) => {
  if (!adminBranch) throw createError("Admin branch is not configured", 400);

  page = Number(page);
  limit = Number(limit);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) limit = 50;

  // Subjects visible to this admin
  const subjectFilter = {};
  if (adminBranch !== "ALL") subjectFilter.branch = adminBranch;

  const subjectIds = (
    await Subject.find(subjectFilter).select("_id").lean()
  ).map((s) => s._id);

  if (subjectIds.length === 0) {
    return { total: 0, page, limit, logs: [] };
  }

  // Sessions we can see
  const sessionFilter = { subject: { $in: subjectIds } };
  if (sessionId && mongoose.isValidObjectId(sessionId)) {
    sessionFilter._id = sessionId;
  }

  const sessionIds = (
    await AttendanceSession.find(sessionFilter).select("_id").lean()
  ).map((s) => s._id);

  if (sessionIds.length === 0) {
    return { total: 0, page, limit, logs: [] };
  }

  // Attendance records
  const filter = { session: { $in: sessionIds } };

  if (studentId && mongoose.isValidObjectId(studentId)) {
    filter.student = studentId;
  }

  if (fromDate || toDate) {
    filter.markedAt = {};
    if (fromDate) {
      const start = new Date(fromDate);
      if (Number.isNaN(start.getTime())) {
        throw createError("Invalid fromDate", 400);
      }
      start.setHours(0, 0, 0, 0);
      filter.markedAt.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      if (Number.isNaN(end.getTime())) {
        throw createError("Invalid toDate", 400);
      }
      end.setHours(23, 59, 59, 999);
      filter.markedAt.$lte = end;
    }
  }

  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .sort({ markedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("student", "firstName lastName registrationNumber emailId")
      .populate({
        path: "session",
        select: "sessionCode startedAt status subject faculty",
        populate: [
          { path: "subject", select: "subjectName subjectCode course branch semester" },
          { path: "faculty", select: "firstName lastName emailId" }
        ]
      })
      .lean()
  ]);

  const logs = records.map((r) => ({
    attendanceId: r._id,
    markedAt: r.markedAt,
    status: r.status,
    verification: r.verification || null,
    student: r.student
      ? {
          id: r.student._id,
          name: `${r.student.firstName} ${r.student.lastName}`,
          registrationNumber: r.student.registrationNumber,
          emailId: r.student.emailId
        }
      : null,
    session: r.session
      ? {
          id: r.session._id,
          sessionCode: r.session.sessionCode,
          startedAt: r.session.startedAt,
          status: r.session.status,
          subject: r.session.subject
            ? {
                id: r.session.subject._id,
                name: r.session.subject.subjectName,
                code: r.session.subject.subjectCode,
                course: r.session.subject.course,
                branch: r.session.subject.branch,
                semester: r.session.subject.semester
              }
            : null,
          faculty: r.session.faculty
            ? {
                id: r.session.faculty._id,
                name: `${r.session.faculty.firstName} ${r.session.faculty.lastName}`,
                emailId: r.session.faculty.emailId
              }
            : null
        }
      : null
  }));

  return { total, page, limit, logs };
};

module.exports = { getAuditLogs };