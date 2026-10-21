const subjectService = require("../../services/subject.service");

// ==========================================
// GET /api/admin/subjects
// ==========================================
const getAllSubjects = async (req, res, next) => {
    try {
        const subjects = await subjectService.getAllSubjects({
            status: req.query.status,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET /api/admin/subjects/:id
// ==========================================
const getSubjectById = async (req, res, next) => {
    try {
        const subject = await subjectService.getSubjectById({
            subjectId: req.params.id,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// PATCH /api/admin/subjects/:id/approve
// ==========================================
const approveSubject = async (req, res, next) => {
    try {
        const subject = await subjectService.approveSubject({
            subjectId: req.params.id,
            adminId: req.user.id,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            message: "Subject approved successfully",
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// PATCH /api/admin/subjects/:id/reject
// ==========================================
const rejectSubject = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const subject = await subjectService.rejectSubject({
            subjectId: req.params.id,
            adminId: req.user.id,
            reason,
            adminBranch: req.user.adminBranch
        });

        return res.status(200).json({
            success: true,
            message: "Subject rejected",
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    approveSubject,
    rejectSubject
};