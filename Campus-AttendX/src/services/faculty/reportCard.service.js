const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Attendance = require("../../models/Attendance");
const AttendanceSession = require("../../models/AttendanceSession");
const { sendMail } = require("../../utils/mailer");
const { sendSms } = require("../../utils/sms");

const generateAndSendReportCard = async (studentId, subjectId = null) => {
  const student = await User.findById(studentId);
  if (!student) throw new Error("Student not found");

  // 1. Filter Subjects
  const subjectQuery = {
    course: student.course, branch: student.branch, semester: student.semester,
    status: "approved", isActive: true
  };
  if (subjectId) subjectQuery._id = subjectId; // Only selected subject

  const subjects = await Subject.find(subjectQuery);
  if (subjects.length === 0) return { success: false, message: "No subjects found" };

  const subjectIds = subjects.map(s => s._id);

  const sessions = await AttendanceSession.find({
    subject: { $in: subjectIds }, status: { $in: ["closed", "expired"] }
  });

  const attendanceRecords = await Attendance.find({
    student: student._id, session: { $in: sessions.map(s => s._id) }
  });

  const attendedSessionIds = new Set(attendanceRecords.map(r => r.session.toString()));

  let totalConducted = 0, totalAttended = 0;
  const reportData = [];
  let hasBelow75 = false;

  subjects.forEach(sub => {
    const subSessions = sessions.filter(s => s.subject.toString() === sub._id.toString());
    const subTotal = subSessions.length;
    let subAttended = 0;

    subSessions.forEach(s => { if (attendedSessionIds.has(s._id.toString())) subAttended++; });

    const percentage = subTotal > 0 ? (subAttended / subTotal) * 100 : 0;
    const isBelow75 = percentage < 75 && subTotal > 0;

    if (isBelow75) hasBelow75 = true;
    totalConducted += subTotal;
    totalAttended += subAttended;

    reportData.push({
      subjectName: sub.subjectName, subjectCode: sub.subjectCode,
      total: subTotal, attended: subAttended, percentage: Number(percentage.toFixed(2)), isBelow75
    });
  });

  if (!hasBelow75) {
     return { success: false, message: "Attendance is above 75%, no warning needed." };
  }

  const overallPercentage = totalConducted > 0 ? Number(((totalAttended / totalConducted) * 100).toFixed(2)) : 0;

  const rows = reportData.map(r => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;">${r.subjectName}</td>
      <td style="padding: 10px; text-align: center;">${r.attended} / ${r.total}</td>
      <td style="padding: 10px; text-align: center; font-weight: bold; color: ${r.isBelow75 ? '#ef4444' : '#10b981'};">
        ${r.percentage}%
      </td>
    </tr>`).join("");

  const html = `
    <div style="font-family: Arial; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="background: #ef4444; color: white; padding: 15px; text-align: center;">
        <h2 style="margin: 0;">⚠️ Detention Warning</h2>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${student.firstName} ${student.lastName},</p>
        <p>Your attendance is below 75%. If you do not attend upcoming classes, <strong>you will be detained from exams.</strong></p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f8fafc;"><th>Subject</th><th>Attended/Total</th><th>%</th></tr>
          ${rows}
        </table>
      </div>
    </div>`;

  await sendMail({ to: student.emailId, subject: "⚠️ Attendance Warning", html });
  
  if (student.phone) {
    await sendSms(student.phone, `AttendX Alert: You have <75% attendance in ${reportData.find(r=>r.isBelow75).subjectName}. You risk detention. Check email.`);
  }

  return { success: true, hasBelow75 };
};

module.exports = { generateAndSendReportCard };