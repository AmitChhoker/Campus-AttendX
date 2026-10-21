const User = require("../../models/User");
const { generateAndSendReportCard } = require("../../services/faculty/reportCard.service");

const sendBulkReports = async (req, res, next) => {
  try {
    const { subjectId } = req.body; // Now taking subjectId
    if (!subjectId) throw new Error("Subject ID is required");

    // Find students only for this specific subject's class
    const Subject = require("../../models/Subject");
    const subject = await Subject.findById(subjectId);
    if(!subject) throw new Error("Subject not found");

    const students = await User.find({
      role: "student", course: subject.course, branch: subject.branch, semester: subject.semester, isActive: true
    });

    let sentCount = 0;
    for (const student of students) {
      const res = await generateAndSendReportCard(student._id, subjectId);
      if (res.success) sentCount++;
    }

    res.status(200).json({
      success: true,
      message: `Warnings sent to ${sentCount} defaulters out of ${students.length} students.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendBulkReports };