const subjectService = require("../../services/subject.service");
const { validateSubjectData } = require("../../validators/subject.validator");

// ==========================================
// POST /api/subjects (Create)
// ==========================================
const createSubject = async (req, res, next) => {
    try {
        const errors = validateSubjectData(req.body);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject data",
                errors
            });
        }

        const subject = await subjectService.createSubject({
            data: req.body,
            facultyId: req.user.id,
            file: req.file
        });

        return res.status(201).json({
            success: true,
            message: "Subject submitted successfully for admin approval",
            data: subject
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET /api/subjects/my-submissions (Get All)
// ==========================================
const getMySubjects = async (req, res, next) => {
    try {
        const subjects = await subjectService.getMySubjects(req.user.id);
        return res.status(200).json({
            success: true,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET /api/subjects/my-submissions/:id (Get One)
// ==========================================
const getMySubjectById = async (req, res, next) => {
    try {
        const subject = await subjectService.getMySubjectById({
            subjectId: req.params.id,
            facultyId: req.user.id
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
// PATCH /api/subjects/:id (Resubmit)
// ==========================================
const resubmitSubject = async (req, res, next) => {
    try {
        const errors = validateSubjectData(req.body);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject data",
                errors
            });
        }

        const subject = await subjectService.resubmitSubject({
            subjectId: req.params.id,
            facultyId: req.user.id,
            data: req.body,
            file: req.file
        });

        return res.status(200).json({
            success: true,
            message: "Subject resubmitted for admin approval",
            data: subject
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// DELETE /api/subjects/:id (Delete)
// ==========================================
const deleteSubject = async (req, res, next) => {
    try {
        const result = await subjectService.deleteSubject({
            subjectId: req.params.id,
            facultyId: req.user.id
        });
        
        return res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSubject,
    getMySubjects,
    getMySubjectById,
    resubmitSubject,
    deleteSubject
};