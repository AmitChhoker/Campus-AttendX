
const adminUserService = require("../../services/Admin/adminUser.service");


const bcrypt = require("bcrypt");

const createUser = async ({ data, adminBranch }) => {
    const allowedRoles = ["student", "faculty", "admin"];
    if (!allowedRoles.includes(data.role)) {
        throw new Error("Invalid role");
    }

    // Branch-admin can only create users in their branch
    if (
        adminBranch !== "ALL" &&
        data.branch &&
        data.branch !== adminBranch
    ) {
        throw new Error("You cannot create users outside your branch");
    }

    if (!data.emailId || !data.password || !data.phone) {
        throw new Error("emailId, password and phone are required");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailId: data.emailId.toLowerCase().trim(),
        password: hashedPassword,
        phone: data.phone,
        role: data.role,
        registrationNumber: data.registrationNumber,
        department: data.department,
        course: data.course,
        branch: data.branch,
        adminBranch:
            data.role === "admin"
                ? data.adminBranch || adminBranch || "ALL"
                : undefined,
        batch: data.batch,
        semester: data.semester,
        isActive: true
    });

    const obj = user.toObject();
    delete obj.password;
    return obj;
};
// =====================================================
// STUDENTS
// =====================================================

// GET /api/admin/users/students


const getStudents = async (req, res, next) => {

    try {

        const {
            search,
            course,
            branch,
            semester,
            batch,
            isActive
        } = req.query;

        const result =
            await adminUserService.getStudents({
                search,
                course,
                branch,
                semester,
                batch,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET STUDENT BY ID
// =====================================================

// GET /api/admin/users/students/:id
const getStudentById = async (req, res, next) => {

    try {

        const student =
            await adminUserService.getStudentById({
                studentId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// FACULTY
// =====================================================

// GET /api/admin/users/faculty
const getFaculty = async (req, res, next) => {

    try {

        const {
            search,
            branch,
            course,
            isActive
        } = req.query;

        const result =
            await adminUserService.getFaculty({
                search,
                branch,
                course,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET FACULTY BY ID
// =====================================================

// GET /api/admin/users/faculty/:id
const getFacultyById = async (req, res, next) => {

    try {

        const faculty =
            await adminUserService.getFacultyById({
                facultyId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: faculty
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// ADMINS
// =====================================================

// GET /api/admin/users/admins
const getAdmins = async (req, res, next) => {

    try {

        const {
            search,
            isActive
        } = req.query;

        const result =
            await adminUserService.getAdmins({
                search,
                isActive,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ADMIN BY ID
// =====================================================

// GET /api/admin/users/admins/:id
const getAdminById = async (req, res, next) => {

    try {

        const admin =
            await adminUserService.getAdminById({
                adminId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            data: admin
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// ACTIVATE USER
// =====================================================

// PATCH /api/admin/users/:id/activate
const activateUser = async (req, res, next) => {

    try {

        const user =
            await adminUserService.activateUser({
                userId: req.params.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            message: "User activated successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};


// =====================================================
// DEACTIVATE USER
// =====================================================

// PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res, next) => {

    try {

        const user =
            await adminUserService.deactivateUser({
                userId: req.params.id,
                adminId: req.user.id,

                // Branch assigned to logged-in admin
                adminBranch: req.user.adminBranch
            });

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
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