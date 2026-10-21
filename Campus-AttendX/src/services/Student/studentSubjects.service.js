const mongoose = require("mongoose");

const User = require("../../models/User");
const Subject = require("../../models/Subject");

// =====================================================
// HELPER: VALIDATE OBJECT ID
// =====================================================

const validateObjectId = (id, fieldName) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// =====================================================
// HELPER: GET AUTHENTICATED STUDENT
// =====================================================

const getActiveStudent = async (studentId) => {

    validateObjectId(studentId, "student ID");

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

    return student;
};

// =====================================================
// HELPER: BUILD STUDENT SUBJECT FILTER
// =====================================================

const buildSubjectFilter = (student, semester) => {

    return {
        course: student.course,
        branch: student.branch,
        semester: semester,

        status: "approved",
        isActive: true
    };
};

// =====================================================
// 1. GET MY SUBJECTS
// =====================================================

const getMySubjects = async ({
    studentId,
    semester
}) => {

    // Find authenticated student.

    const student = await getActiveStudent(studentId);

    // Use current semester unless the student selects another.

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

    // Find approved and active subjects matching the student.

    const subjects = await Subject.find(
        buildSubjectFilter(student, selectedSemester)
    )
        .select(
            "subjectName subjectCode course branch semester " +
            "credits type syllabus submittedBy createdAt"
        )
        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )
        .sort({
            subjectName: 1
        })
        .lean();

    // Format the response.

    const formattedSubjects = subjects.map(subject => ({
        id: subject._id,

        subjectName: subject.subjectName,

        subjectCode: subject.subjectCode,

        course: subject.course,

        branch: subject.branch,

        semester: subject.semester,

        credits: subject.credits,

        type: subject.type,

        faculty: subject.submittedBy
            ? {
                id: subject.submittedBy._id,

                name:
                    `${subject.submittedBy.firstName} ` +
                    `${subject.submittedBy.lastName}`,

                email: subject.submittedBy.emailId
            }
            : null,

        syllabus: subject.syllabus
            ? {
                fileName: subject.syllabus.fileName,
                available: Boolean(subject.syllabus.fileId)
            }
            : null
    }));

    return {
        student: {
            id: student._id,

            name:
                `${student.firstName} ${student.lastName}`,

            registrationNumber:
                student.registrationNumber,

            course: student.course,

            branch: student.branch,

            currentSemester: student.semester
        },

        selectedSemester,

        totalSubjects: formattedSubjects.length,

        subjects: formattedSubjects
    };
};

// =====================================================
// 2. GET SUBJECT DETAILS
// =====================================================

const getMySubjectById = async ({
    studentId,
    subjectId
}) => {

    validateObjectId(subjectId, "subject ID");

    // Find the authenticated student.

    const student = await getActiveStudent(studentId);

    // Find the subject only if it belongs to the student's
    // course, branch and current semester.

    const subject = await Subject.findOne({
        _id: subjectId,

        ...buildSubjectFilter(
            student,
            student.semester
        )
    })
        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )
        .lean();

    if (!subject) {
        throw new Error(
            "Subject not found or you are not authorized to access it"
        );
    }

    return {
        id: subject._id,

        subjectName: subject.subjectName,

        subjectCode: subject.subjectCode,

        course: subject.course,

        branch: subject.branch,

        semester: subject.semester,

        credits: subject.credits,

        type: subject.type,

        isActive: subject.isActive,

        faculty: subject.submittedBy
            ? {
                id: subject.submittedBy._id,

                name:
                    `${subject.submittedBy.firstName} ` +
                    `${subject.submittedBy.lastName}`,

                email: subject.submittedBy.emailId
            }
            : null,

        syllabus: subject.syllabus
            ? {
                fileName: subject.syllabus.fileName,

                available: Boolean(subject.syllabus.fileId)
            }
            : null,

        createdAt: subject.createdAt,

        updatedAt: subject.updatedAt
    };
};

// =====================================================
// 3. GET SYLLABUS DOWNLOAD INFORMATION
// =====================================================

const getSyllabusDownload = async ({
    studentId,
    subjectId
}) => {

    validateObjectId(subjectId, "subject ID");

    const student = await getActiveStudent(studentId);

    // Confirm that the subject belongs to the student's
    // current course, branch and semester.

    const subject = await Subject.findOne({
        _id: subjectId,

        ...buildSubjectFilter(
            student,
            student.semester
        )
    })
        .select(
            "subjectName subjectCode semester syllabus"
        )
        .lean();

    if (!subject) {
        throw new Error(
            "Subject not found or you are not authorized to access it"
        );
    }

    if (
        !subject.syllabus ||
        !subject.syllabus.fileId
    ) {
        throw new Error(
            "Syllabus is not available for this subject"
        );
    }

    return {
        subjectId: subject._id,

        subjectName: subject.subjectName,

        subjectCode: subject.subjectCode,

        fileId: subject.syllabus.fileId,

        fileName: subject.syllabus.fileName,

        fileUrl: subject.syllabus.fileUrl
    };
};

// =====================================================
// EXPORT SERVICES
// =====================================================

module.exports = {
    getMySubjects,
    getMySubjectById,
    getSyllabusDownload
};