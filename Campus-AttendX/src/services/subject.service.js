const Subject = require("../models/Subject");

const {
    uploadToGoogleDrive,
    deleteFromGoogleDrive
} = require("./googleDrive.service");

// ==========================================
// Admin branch scope helper
// ==========================================

const applyAdminBranchScope = (filter, adminBranch) => {
    // Super admin can access all branches.
    if (adminBranch === "ALL") {
        return filter;
    }

    // Branch admin must have a configured branch.
    if (!adminBranch) {
        throw new Error("Admin branch is not configured");
    }

    // Restrict access to the admin's branch.
    filter.branch = adminBranch;

    return filter;
};

// ==========================================
// Faculty creates a new subject
// ==========================================

const createSubject = async ({ data, facultyId, file }) => {
    if (!file) {
        throw new Error("Syllabus PDF is required");
    }

    // Upload the syllabus first.
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

            syllabus: {
                fileId: syllabus.fileId,
                fileName: syllabus.fileName,
                fileUrl: syllabus.fileUrl
            },

            submittedBy: facultyId,
            status: "approved"
        });

        return subject;
    } catch (err) {
        // Clean up the uploaded PDF if database creation fails.
        if (syllabus?.fileId) {
            try {
                await deleteFromGoogleDrive(syllabus.fileId);
            } catch (deleteErr) {
                console.error(
                    "Failed to clean up uploaded syllabus:",
                    deleteErr.message
                );
            }
        }

        throw err;
    }
};

// ==========================================
// Faculty gets their submitted subjects
// ==========================================

const getMySubjects = async (facultyId) => {
    return Subject.find({
        submittedBy: facultyId
    })
        .populate(
            "reviewedBy",
            "firstName lastName emailId"
        )
        .sort({ createdAt: -1 });
};

// ==========================================
// Faculty gets one of their submissions
// ==========================================

const getMySubjectById = async ({
    subjectId,
    facultyId
}) => {
    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId
    }).populate(
        "reviewedBy",
        "firstName lastName emailId"
    );

    if (!subject) {
        throw new Error("Subject submission not found");
    }

    return subject;
};

// ==========================================
// Admin gets all subjects
// ==========================================

const getAllSubjects = async ({
    status,
    adminBranch
}) => {
    const filter = {};

    if (status) {
        filter.status = status;
    }

    applyAdminBranchScope(filter, adminBranch);

    return Subject.find(filter)
        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )
        .populate(
            "reviewedBy",
            "firstName lastName emailId"
        )
        .sort({ createdAt: -1 });
};

// ==========================================
// Admin gets one subject
// ==========================================

const getSubjectById = async ({
    subjectId,
    adminBranch
}) => {
    const filter = {
        _id: subjectId
    };

    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter)
        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )
        .populate(
            "reviewedBy",
            "firstName lastName emailId"
        );

    if (!subject) {
        throw new Error("Subject not found or access denied");
    }

    return subject;
};

// ==========================================
// Admin approves a subject
// ==========================================

const approveSubject = async ({
    subjectId,
    adminId,
    adminBranch
}) => {
    const filter = {
        _id: subjectId
    };

    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter);

    if (!subject) {
        throw new Error("Subject not found or access denied");
    }

    if (subject.status === "approved") {
        throw new Error("Subject is already approved");
    }

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

const rejectSubject = async ({
    subjectId,
    adminId,
    reason,
    adminBranch
}) => {
    const filter = {
        _id: subjectId
    };

    applyAdminBranchScope(filter, adminBranch);

    const subject = await Subject.findOne(filter);

    if (!subject) {
        throw new Error("Subject not found or access denied");
    }

    if (!reason || reason.trim().length < 3) {
        throw new Error("Rejection reason must contain at least 3 characters");
    }

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

const resubmitSubject = async ({
    subjectId,
    facultyId,
    data,
    file
}) => {
    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId
    });

    if (!subject) {
        throw new Error("Subject not found");
    }

    if (
        subject.status !== "rejected" &&
        subject.status !== "pending"
    ) {
        throw new Error(
            "Only pending or rejected subjects can be edited"
        );
    }

    // Update subject information.
    subject.subjectName = data.subjectName;
    subject.subjectCode = data.subjectCode;
    subject.course = data.course;
    subject.branch = data.branch;
    subject.semester = Number(data.semester);
    subject.credits = Number(data.credits);
    subject.type = data.type;

    let newSyllabus = null;
    const oldFileId = subject.syllabus?.fileId;

    // Upload the replacement PDF if provided.
    if (file) {
        newSyllabus = await uploadToGoogleDrive(file);

        subject.syllabus = {
            fileId: newSyllabus.fileId,
            fileName: newSyllabus.fileName,
            fileUrl: newSyllabus.fileUrl
        };
    }

    // Require admin approval again after resubmission.
    subject.status = "pending";
    subject.reviewedBy = null;
    subject.reviewedAt = null;
    subject.rejectionReason = null;

    try {
        await subject.save();
    } catch (err) {
        // Remove the newly uploaded PDF if saving fails.
        if (newSyllabus?.fileId) {
            try {
                await deleteFromGoogleDrive(newSyllabus.fileId);
            } catch (deleteErr) {
                console.error(
                    "Failed to clean up replacement syllabus:",
                    deleteErr.message
                );
            }
        }

        throw err;
    }

    // Delete the previous PDF only after saving succeeds.
    if (
        newSyllabus?.fileId &&
        oldFileId &&
        oldFileId !== newSyllabus.fileId
    ) {
        try {
            await deleteFromGoogleDrive(oldFileId);
        } catch (deleteErr) {
            console.error(
                "Failed to delete previous syllabus:",
                deleteErr.message
            );
        }
    }

    return subject;
};

// ==========================================
// Exports
// ==========================================
// ==========================================
// Faculty deletes their own pending/rejected subject
// (Cascades sessions + attendance)
// ==========================================

const deleteSubject = async ({ subjectId, facultyId }) => {
    const subject = await Subject.findOne({
        _id: subjectId,
        submittedBy: facultyId
    });

    if (!subject) throw new Error("Subject not found");

    if (subject.status === "approved") {
        throw new Error(
            "Approved subjects cannot be deleted. Ask an admin to deactivate it instead."
        );
    }

    // Cascade delete: attendance -> sessions -> syllabus file -> subject
    const AttendanceSession = require("../models/AttendanceSession");
    const Attendance = require("../models/Attendance");

    const sessions = await AttendanceSession.find({
        subject: subject._id
    }).select("_id").lean();

    const sessionIds = sessions.map((s) => s._id);

    if (sessionIds.length > 0) {
        await Attendance.deleteMany({ session: { $in: sessionIds } });
        await AttendanceSession.deleteMany({ subject: subject._id });
    }

    if (subject.syllabus?.fileId) {
        try {
            await deleteFromGoogleDrive(subject.syllabus.fileId);
        } catch (err) {
            console.error("Syllabus cleanup failed:", err.message);
        }
    }

    await Subject.deleteOne({ _id: subject._id });

    return { deleted: true, subjectId: subject._id };
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