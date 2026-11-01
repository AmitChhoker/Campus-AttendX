const studentSubjectsService = require("../../services/student/studentSubjects.service");
const AttendanceSession = require("../../models/AttendanceSession");
const Attendance = require("../../models/Attendance");

// =====================================================
// 1. GET MY SUBJECTS (List)
// =====================================================
const getMySubjects = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { semester } = req.query;

        const data = await studentSubjectsService.getMySubjects({
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
// 2. GET SUBJECT DETAILS & ATTENDANCE HISTORY
// =====================================================
const getMySubjectById = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { subjectId } = req.params;

        // 1. Basic Subject Details (Service se)
        const subjectData = await studentSubjectsService.getMySubjectById({
            studentId,
            subjectId
        });

        if (!subjectData) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        // 2. Subject ke saare closed/expired sessions nikalein
        const sessions = await AttendanceSession.find({ 
            subject: subjectId, 
            status: { $in: ["closed", "expired"] } 
        })
        .populate("faculty", "firstName lastName")
        .sort({ startedAt: -1 });

        // 3. Student ki attendance records nikalein
        const attendedRecords = await Attendance.find({ 
            student: studentId, 
            session: { $in: sessions.map(s => s._id) } 
        });
        
        const attendedIds = new Set(attendedRecords.map(a => a.session.toString()));

        // 4. History calculate karein
        let present = 0;
        const history = [];

        sessions.forEach(s => {
            const isPresent = attendedIds.has(s._id.toString());
            if (isPresent) present++;
            
            history.push({
                date: s.startedAt,
                status: isPresent ? "present" : "absent",
                faculty: s.faculty ? `${s.faculty.firstName} ${s.faculty.lastName}` : "Unknown",
                type: subjectData.type || "theory" 
            });
        });

        const total = sessions.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
        const neededToReach75 = total > 0 ? Math.ceil((0.75 * total) - present) : 0;

        // 5. Frontend ke hisaab se Final Response banayein
        const responseData = {
            subject: {
                id: subjectData._id || subjectId,
                name: subjectData.subjectName || subjectData.name,
                code: subjectData.subjectCode || subjectData.code,
                course: subjectData.course,
                branch: subjectData.branch,
                semester: subjectData.semester,
                type: subjectData.type,
                credits: subjectData.credits,
                faculty: subjectData.faculty?.name || "N/A",
                syllabus: subjectData.syllabus // Syllabus details
            },
            attendance: {
                totalClasses: total,
                present: present,
                absent: total - present,
                percentage: Number(percentage),
                neededToReach75: neededToReach75 > 0 ? neededToReach75 : 0
            },
            history: history
        };

        return res.status(200).json({
            success: true,
            message: "Subject details and attendance history fetched successfully",
            data: responseData
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

        const syllabus = await studentSubjectsService.getSyllabusDownload({
            studentId,
            subjectId
        });

        const downloadUrl =
            `https://drive.google.com/uc?export=download&id=` +
            encodeURIComponent(syllabus.fileId);

        return res.redirect(downloadUrl);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMySubjects,
    getMySubjectById,
    downloadSyllabus
};