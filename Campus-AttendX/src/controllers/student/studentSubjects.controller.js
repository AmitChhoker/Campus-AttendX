const studentSubjectsService = require(
    "../../services/student/studentSubjects.service"
);

// =====================================================
// 1. GET MY SUBJECTS
// =====================================================

const getMySubjects = async (req, res, next) => {

    try {

        const studentId = req.user.id;

        const { semester } = req.query;

        const data =
            await studentSubjectsService.getMySubjects({
                studentId,
                semester
            });

        return res.status(200).json({
            success: true,

            message: "Student subjects fetched successfully",

            data
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 2. GET SUBJECT DETAILS
// =====================================================

const getMySubjectById = async (req, res, next) => {

    try {

        const studentId = req.user.id;

        const { subjectId } = req.params;

        const data =
            await studentSubjectsService.getMySubjectById({
                studentId,
                subjectId
            });

        return res.status(200).json({
            success: true,

            message: "Subject details fetched successfully",

            data
        });

    } catch (error) {
        next(error);
    }
};

// =====================================================
// 3. DOWNLOAD SYLLABUS
// =====================================================

const downloadSyllabus = async (req, res, next) => {

    try {

        const studentId = req.user.id;

        const { subjectId } = req.params;

        const syllabus =
            await studentSubjectsService.getSyllabusDownload({
                studentId,
                subjectId
            });

        // Redirect the browser to Google's direct-download URL.
        //
        // This requires the Drive file to be accessible to the
        // student through Google Drive sharing permissions.

        const downloadUrl =
            `https://drive.google.com/uc?export=download&id=` +
            encodeURIComponent(syllabus.fileId);

        return res.redirect(downloadUrl);

    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    getMySubjects,
    getMySubjectById,
    downloadSyllabus
};