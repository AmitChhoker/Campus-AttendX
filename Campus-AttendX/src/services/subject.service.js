const Subject = require("../models/Subject");
const AttendanceSession = require("../models/AttendanceSession");
const Attendance = require("../models/Attendance");
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require("./googleDrive.service");

// ==========================================
// Admin branch scope helper
// ==========================================
const applyAdminBranchScope = (filter, adminBranch) => {
    if (adminBranch === "ALL") return filter;
    if (!adminBranch) throw new Error("Admin branch is not configured");
    filter.branch = adminBranch;
    return filter;
};

// ==========================================
// Faculty creates a new subject
// ==========================================
const createSubject = async ({ data, facultyId, file }) => {
    if (!file) throw new Error("Syllabus PDF is required");

    const syllabus = await uploadToGoogleDrive(file);

    try {
        const subject = await Subject.create({
            subjectName: data.subjectName,
            subjectCode: data.subjectCode,
            course: data.course,
            branch: data.branch,
            semester: Number(data.semester),
            credits: Number(data.credits),
            type: data.type,
            totalPlannedClasses: Number(data.totalPlannedClasses) || 40, // Fallback
            syllabus: {
                fileId: syllabus.fileId,
                fileName: syllabus.fileName,
                fileUrl: syllabus.fileUrl
            },
            submittedBy: facultyId,
            status: "approved" // Note: Ise 'pending' karein agar admin approval chahiye
        });

        return subject;
    } catch (err) {
        if (syllabus?.fileId) {
            try { await deleteFromGoogleDrive(syllabus.fileId); } catch (e) {}
        }
        throw err;
    }
};

// ==========================================
// Faculty gets their submitted subjects
// ==========================================
const getMySubjects = async (facultyId) => {
    return Subject.find({ submittedBy: facultyId })
        .populate("reviewedBy", "firstName lastName emailId")
        .sort({ createdAt: -1 });
};

// ==========================================
// Faculty gets one of their submissions
// ==========================================
const getMySubjectById = async ({ subjectId, facultyId }) => {
    const subject = await Subject.findOne({ _id: subjectId, submittedBy: facultyId })
        .populate("reviewedBy", "firstName lastName emailId");

    if (!subject) throw new Error("Subject submission not found");
    return subject;
};

// ==========================================
// Admin gets all subjects
// ==========================================
const getAllSubjects = async ({ status, adminBranch }) => {
    const filter = {};
    if (status) filter.status = status;
    applyAdminBranchScope(filter, adminBranch);

    return Subject.find(filter)
        .populate("submittedBy", "firstName lastName emailId")
        .populate("reviewedBy", "firstName lastName emailId")
        .sort({ createdAt: -1 });
};

// ==========================================
// Admin gets one subject
// ==========================================
const getSubjectById = async ({ subjectId, adminBranch }) => {
    const filter = { _id: subjectId };
    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter)
        .populate("submittedBy", "firstName lastName emailId")
        .populate("reviewedBy", "firstName lastName emailId");

    if (!subject) throw new Error("Subject not found or access denied");
    return subject;
};

// ==========================================
// Admin approves a subject
// ==========================================
const approveSubject = async ({ subjectId, adminId, adminBranch }) => {
    const filter = { _id: subjectId };
    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter);
    if (!subject) throw new Error("Subject not found or access denied");
    if (subject.status === "approved") throw new Error("Subject is already approved");

    subject.status = "approved";
    subject.reviewedBy = adminId;
    subject.reviewedAt = new Date();
    subject.rejectionReason = null;
    subject.isActive = true;

    await subject.save();
    return subject;
};

// ==========================================
// Admin rejects a subject
// ==========================================
const rejectSubject = async ({ subjectId, adminId, reason, adminBranch }) => {
    const filter = { _id: subjectId };
    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter);
    if (!subject) throw new Error("Subject not found or access denied");
    if (!reason || reason.trim().length < 3) throw new Error("Rejection reason must contain at least 3 characters");

    subject.status = "rejected";
    subject.reviewedBy = adminId;
    subject.reviewedAt = new Date();
    subject.rejectionReason = reason.trim();

    await subject.save();
    return subject;
};

// ==========================================
// Faculty resubmits a subject
// ==========================================
const resubmitSubject = async ({ subjectId, facultyId, data, file }) => {
    const subject = await Subject.findOne({ _id: subjectId, submittedBy: facultyId });

    if (!subject) throw new Error("Subject not found");
    if (subject.status !== "rejected" && subject.status !== "pending") {
        throw new Error("Only pending or rejected subjects can be edited");
    }

    subject.subjectName = data.subjectName;
    subject.subjectCode = data.subjectCode;
    subject.course = data.course;
    subject.branch = data.branch;
    subject.semester = Number(data.semester);
    subject.credits = Number(data.credits);
    subject.type = data.type;

    let newSyllabus = null;
    const oldFileId = subject.syllabus?.fileId;

    if (file) {
        newSyllabus = await uploadToGoogleDrive(file);
        subject.syllabus = {
            fileId: newSyllabus.fileId,
            fileName: newSyllabus.fileName,
            fileUrl: newSyllabus.fileUrl
        };
    }

    subject.status = "pending";
    subject.reviewedBy = null;
    subject.reviewedAt = null;
    subject.rejectionReason = null;

    try {
        await subject.save();
    } catch (err) {
        if (newSyllabus?.fileId) {
            try { await deleteFromGoogleDrive(newSyllabus.fileId); } catch (e) {}
        }
        throw err;
    }

    if (newSyllabus?.fileId && oldFileId && oldFileId !== newSyllabus.fileId) {
        try { await deleteFromGoogleDrive(oldFileId); } catch (e) {}
    }

    return subject;
};

// ==========================================
// Faculty Deletes Subject (With Cascade Delete)
// ==========================================
const deleteSubject = async ({ subjectId, facultyId }) => {
    // 1. Check if subject exists
    const subject = await Subject.findOne({ _id: subjectId, submittedBy: facultyId });
    if (!subject) throw new Error("Subject not found or unauthorized");

    // 2. Find all sessions for this subject
    const sessions = await AttendanceSession.find({ subject: subjectId });
    const sessionIds = sessions.map(s => s._id);

    // 3. Delete all attendance records for these sessions
    if (sessionIds.length > 0) {
        await Attendance.deleteMany({ session: { $in: sessionIds } });
    }

    // 4. Delete the sessions
    await AttendanceSession.deleteMany({ subject: subjectId });

    // 5. Delete Syllabus from Google Drive (Optional)
    if (subject.syllabus && subject.syllabus.fileId) {
        try {
            await deleteFromGoogleDrive(subject.syllabus.fileId);
        } catch (err) {
            console.log("Failed to delete syllabus from drive:", err.message);
        }
    }

    // 6. Finally delete the subject
    await Subject.findByIdAndDelete(subjectId);

    return { success: true, message: "Subject and all related data deleted." };
};

module.exports = {
    createSubject,
    getMySubjects,
    getMySubjectById,
    getAllSubjects,
    getSubjectById,
    approveSubject,
    rejectSubject,
    resubmitSubject,
    deleteSubject
};