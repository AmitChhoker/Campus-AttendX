// src/validators/subject.validator.js

/**
 * Validate subject submission payload.
 * Returns an object mapping fieldName → errorMessage.
 * Returns {} when valid.
 */
function validateSubjectData(data) {
    const errors = {};

    // subjectName
    if (!data.subjectName || typeof data.subjectName !== "string") {
        errors.subjectName = "Subject name is required";
    } else {
        const name = data.subjectName.trim();
        if (name.length < 2) {
            errors.subjectName = "Subject name must be at least 2 characters";
        } else if (name.length > 100) {
            errors.subjectName = "Subject name must be at most 100 characters";
        }
    }

    // subjectCode
    if (!data.subjectCode || typeof data.subjectCode !== "string") {
        errors.subjectCode = "Subject code is required";
    } else if (!data.subjectCode.trim()) {
        errors.subjectCode = "Subject code cannot be empty";
    }

    // course
    const allowedCourses = ["B.TECH", "BCA", "DIPLOMA"];
    if (
        !data.course ||
        !allowedCourses.includes(String(data.course).toUpperCase())
    ) {
        errors.course = "Course must be one of: B.TECH, BCA, DIPLOMA";
    }

    // branch
    if (!data.branch || typeof data.branch !== "string" || !data.branch.trim()) {
        errors.branch = "Branch is required";
    }

    // semester
    const semester = Number(data.semester);
    if (
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 8
    ) {
        errors.semester = "Semester must be an integer between 1 and 8";
    }

    // credits
    const credits = Number(data.credits);
    if (!Number.isFinite(credits) || credits < 0) {
        errors.credits = "Credits must be a non-negative number";
    }

    // type
    const allowedTypes = ["theory", "lab", "elective"];
    if (!data.type || !allowedTypes.includes(data.type)) {
        errors.type = "Type must be one of: theory, lab, elective";
    }

    return errors;
}

module.exports = { validateSubjectData };