const mongoose = require("mongoose");
const User = require("../../models/User");


// =====================================================
// HELPER
// =====================================================

const applyBranchScope = (filter, adminBranch) => {

    // Super admin can access all branches
    if (adminBranch === "ALL") {
        return filter;
    }

    // Branch admin can access only their assigned branch
    if (!adminBranch) {
        throw new Error(
            "Admin branch is not configured"
        );
    }

    filter.branch = adminBranch;

    return filter;
};


// =====================================================
// GET STUDENTS
// =====================================================

const getStudents = async ({
    search,
    course,
    branch,
    semester,
    batch,
    isActive,
    adminBranch
}) => {

    const filter = {
        role: "student"
    };

    // ---------------------------------------------
    // ADMIN BRANCH SCOPE
    // ---------------------------------------------

    applyBranchScope(filter, adminBranch);


    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    if (search) {

        filter.$or = [
            {
                firstName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                lastName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                emailId: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                registrationNumber: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }


    // ---------------------------------------------
    // COURSE
    // ---------------------------------------------

    if (course) {
        filter.course = course.toUpperCase();
    }


    // ---------------------------------------------
    // BRANCH
    // ---------------------------------------------
    // Only ALL admin is allowed to choose another branch.
    // Branch admins are already restricted above.

    if (
        branch &&
        adminBranch === "ALL"
    ) {
        filter.branch = branch.toUpperCase();
    }


    // ---------------------------------------------
    // SEMESTER
    // ---------------------------------------------

    if (semester) {

        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 8
        ) {
            throw new Error(
                "Invalid semester"
            );
        }

        filter.semester = semesterNumber;
    }


    // ---------------------------------------------
    // BATCH
    // ---------------------------------------------

    if (batch) {

        const batchNumber = Number(batch);

        if (!Number.isInteger(batchNumber)) {
            throw new Error(
                "Invalid batch"
            );
        }

        filter.batch = batchNumber;
    }


    // ---------------------------------------------
    // ACTIVE STATUS
    // ---------------------------------------------

    if (isActive !== undefined) {

        if (
            isActive !== "true" &&
            isActive !== "false"
        ) {
            throw new Error(
                "isActive must be true or false"
            );
        }

        filter.isActive = isActive === "true";
    }


    const students = await User.find(filter)
        .select("-password")
        .sort({
            firstName: 1,
            lastName: 1
        });


    return {
        totalStudents: students.length,
        students
    };
};


// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudentById = async ({
    studentId,
    adminBranch
}) => {

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error(
            "Invalid student ID"
        );
    }

    const filter = {
        _id: studentId,
        role: "student"
    };

    applyBranchScope(
        filter,
        adminBranch
    );


    const student = await User.findOne(filter)
        .select("-password");


    if (!student) {
        throw new Error(
            "Student not found or access denied"
        );
    }


    return student;
};


// =====================================================
// GET FACULTY
// =====================================================

const getFaculty = async ({
    search,
    branch,
    course,
    isActive,
    adminBranch
}) => {

    const filter = {
        role: "faculty"
    };


    // ---------------------------------------------
    // ADMIN BRANCH SCOPE
    // ---------------------------------------------

    applyBranchScope(
        filter,
        adminBranch
    );


    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    if (search) {

        filter.$or = [
            {
                firstName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                lastName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                emailId: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }


    // ---------------------------------------------
    // BRANCH
    // ---------------------------------------------

    if (
        branch &&
        adminBranch === "ALL"
    ) {
        filter.branch = branch.toUpperCase();
    }


    // ---------------------------------------------
    // COURSE
    // ---------------------------------------------

    if (course) {
        filter.course = course.toUpperCase();
    }


    // ---------------------------------------------
    // ACTIVE STATUS
    // ---------------------------------------------

    if (isActive !== undefined) {

        if (
            isActive !== "true" &&
            isActive !== "false"
        ) {
            throw new Error(
                "isActive must be true or false"
            );
        }

        filter.isActive = isActive === "true";
    }


    const faculty = await User.find(filter)
        .select("-password")
        .sort({
            firstName: 1,
            lastName: 1
        });


    return {
        totalFaculty: faculty.length,
        faculty
    };
};


// =====================================================
// GET FACULTY BY ID
// =====================================================

const getFacultyById = async ({
    facultyId,
    adminBranch
}) => {

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        throw new Error(
            "Invalid faculty ID"
        );
    }

    const filter = {
        _id: facultyId,
        role: "faculty"
    };

    applyBranchScope(
        filter,
        adminBranch
    );


    const faculty = await User.findOne(filter)
        .select("-password");


    if (!faculty) {
        throw new Error(
            "Faculty not found or access denied"
        );
    }


    return faculty;
};


// =====================================================
// GET ADMINS
// =====================================================

const getAdmins = async ({
    search,
    isActive,
    adminBranch
}) => {

    const filter = {
        role: "admin"
    };


    // ---------------------------------------------
    // ADMIN SCOPE
    // ---------------------------------------------

    /*
        ALL admin:
        Can see all admins.

        Branch admin:
        Can see only admins assigned to the
        same branch.
    */

    if (adminBranch !== "ALL") {

        if (!adminBranch) {
            throw new Error(
                "Admin branch is not configured"
            );
        }

        filter.adminBranch = adminBranch;
    }


    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    if (search) {

        filter.$or = [
            {
                firstName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                lastName: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                emailId: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }


    // ---------------------------------------------
    // ACTIVE STATUS
    // ---------------------------------------------

    if (isActive !== undefined) {

        if (
            isActive !== "true" &&
            isActive !== "false"
        ) {
            throw new Error(
                "isActive must be true or false"
            );
        }

        filter.isActive = isActive === "true";
    }


    const admins = await User.find(filter)
        .select("-password")
        .sort({
            firstName: 1,
            lastName: 1
        });


    return {
        totalAdmins: admins.length,
        admins
    };
};


// =====================================================
// GET ADMIN BY ID
// =====================================================

const getAdminById = async ({
    adminId,
    adminBranch
}) => {

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error(
            "Invalid admin ID"
        );
    }

    const filter = {
        _id: adminId,
        role: "admin"
    };


    if (adminBranch !== "ALL") {

        if (!adminBranch) {
            throw new Error(
                "Admin branch is not configured"
            );
        }

        filter.adminBranch = adminBranch;
    }


    const admin = await User.findOne(filter)
        .select("-password");


    if (!admin) {
        throw new Error(
            "Admin not found or access denied"
        );
    }


    return admin;
};


// =====================================================
// ACTIVATE USER
// =====================================================

const activateUser = async ({
    userId,
    adminBranch
}) => {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(
            "Invalid user ID"
        );
    }

    const filter = {
        _id: userId
    };

    /*
        Important:
        This also prevents an AI/ML admin from activating
        a CE/ECE/ME user by manually providing their ID.
    */

    if (adminBranch !== "ALL") {

        if (!adminBranch) {
            throw new Error(
                "Admin branch is not configured"
            );
        }

        filter.branch = adminBranch;
    }


    const user = await User.findOne(filter);


    if (!user) {
        throw new Error(
            "User not found or access denied"
        );
    }


    if (user.isActive) {
        throw new Error(
            "User is already active"
        );
    }


    user.isActive = true;

    await user.save();


    return await User.findById(userId)
        .select("-password");
};


// =====================================================
// DEACTIVATE USER
// =====================================================

const deactivateUser = async ({
    userId,
    adminId,
    adminBranch
}) => {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(
            "Invalid user ID"
        );
    }


    const filter = {
        _id: userId
    };


    // ---------------------------------------------
    // BRANCH SECURITY
    // ---------------------------------------------

    if (adminBranch !== "ALL") {

        if (!adminBranch) {
            throw new Error(
                "Admin branch is not configured"
            );
        }

        filter.branch = adminBranch;
    }


    const user = await User.findOne(filter);


    if (!user) {
        throw new Error(
            "User not found or access denied"
        );
    }


    // ---------------------------------------------
    // PREVENT SELF DEACTIVATION
    // ---------------------------------------------

    if (
        user._id.toString() ===
        adminId.toString()
    ) {
        throw new Error(
            "You cannot deactivate your own account"
        );
    }


    if (!user.isActive) {
        throw new Error(
            "User is already inactive"
        );
    }


    user.isActive = false;

    await user.save();


    return await User.findById(userId)
        .select("-password");
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getStudents,
    getStudentById,

    getFaculty,
    getFacultyById,

    getAdmins,
    getAdminById,

    activateUser,
    deactivateUser
};