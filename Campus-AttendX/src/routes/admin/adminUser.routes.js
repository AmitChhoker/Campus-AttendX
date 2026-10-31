const express = require("express");

// Naya (Sahi)
const studentDeviceService = require("../../services/student/studentDevice.service");
const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");

const {
    getStudents,
    getStudentById,

    getFaculty,
    getFacultyById,

    getAdmins,
    getAdminById,

    activateUser,
    deactivateUser
} = require(
    "../../controllers/admin/adminUser.controller"
);


// ==========================================
// STUDENTS
// ==========================================

router.get(
    "/students",
    authMiddleware,
    roleMiddleware("admin"),
    getStudents
);

router.get(
    "/students/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getStudentById
);
router.patch(
    "/:id/reset-device",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res, next) => {
        try {
            const result = await studentDeviceService.resetDevice({
                userId: req.params.id,
                adminBranch: req.user.adminBranch
            });
            return res.status(200).json({
                success: true,
                message: "Device binding reset",
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==========================================
// FACULTY
// ==========================================

router.get(
    "/faculty",
    authMiddleware,
    roleMiddleware("admin"),
    getFaculty
);

router.get(
    "/faculty/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getFacultyById
);


// ==========================================
// ADMINS
// ==========================================

router.get(
    "/admins",
    authMiddleware,
    roleMiddleware("admin"),
    getAdmins
);

router.get(
    "/admins/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminById
);


// ==========================================
// USER STATUS
// ==========================================

router.patch(
    "/:id/activate",
    authMiddleware,
    roleMiddleware("admin"),
    activateUser
);

router.patch(
    "/:id/deactivate",
    authMiddleware,
    roleMiddleware("admin"),
    deactivateUser
);


module.exports = router;    