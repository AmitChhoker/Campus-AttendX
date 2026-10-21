const validator = require("validator");

function validUser(data) {
    const mandatoryField = ["firstName", "lastName", "emailId", "password", "phone", "role"];
    const isAllowed = mandatoryField.every((k) => Object.keys(data).includes(k));

    if (!isAllowed) throw new Error("Fields Missing");

    if (!(data.firstName.length >= 3 && data.firstName.length <= 20))
        throw new Error("First name should have atleast 3 char and atmost 20 char");

    if (!validator.isAlpha(data.firstName, "en-US", { ignore: " " }))
        throw new Error("First name must contain only letters");

    if (!(data.lastName.length <= 50))
        throw new Error("Last name should have atmost 50 char");

    if (!validator.isAlpha(data.lastName, "en-US", { ignore: " " }))
        throw new Error("Last name must contain only letters");

    if (!validator.isEmail(data.emailId))
        throw new Error("Invalid Email");

    if (!data.emailId.toLowerCase().endsWith("@svsu.ac.in"))
        throw new Error("Email must be a valid @svsu.ac.in address");

    if (!validator.isStrongPassword(data.password))
        throw new Error("Weak Password");

    if (!validator.isMobilePhone(data.phone, "en-IN"))
        throw new Error("Invalid phone number");

    if (!["student", "faculty", "admin"].includes(data.role))
        throw new Error("Invalid role");

    // Fields required for BOTH student and faculty
    if (data.role === "student" || data.role === "faculty") {
        if (!data.department || data.department.toUpperCase() !== "SFET")
            throw new Error("Invalid department");

        if (!data.branch || !["CE", "AI/ML", "ECE", "ME", "DIPLOMA CE", "BCA"].includes(data.branch.toUpperCase()))
            throw new Error("Invalid branch");
        
        // Course validation
        if (!data.course || !["B.TECH", "BCA", "DIPLOMA"].includes(data.course.toUpperCase()))
            throw new Error("Invalid course");
    }

    // ==========================================
    // STUDENT ONLY VALIDATION
    // ==========================================
    if (data.role === "student") {
        const studentFields = ["registrationNumber", "batch", "semester"];
        const hasAllStudentFields = studentFields.every(
            (k) => Object.keys(data).includes(k) && data[k] !== "" && data[k] !== null && data[k] !== undefined
        );

        if (!hasAllStudentFields)
            throw new Error("Missing student fields (registrationNumber, batch, semester required)");

        if (!validator.isAlphanumeric(data.registrationNumber))
            throw new Error("Registration number must be alphanumeric");

        // Convert to number for validation
        const batchNum = Number(data.batch);
        const semesterNum = Number(data.semester);

        if (isNaN(batchNum) || batchNum < 2000 || batchNum > 2100)
            throw new Error("Invalid batch year (must be between 2000 and 2100)");

        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8)
            throw new Error("Invalid semester (must be between 1 and 8)");
    }
}

module.exports = validUser;