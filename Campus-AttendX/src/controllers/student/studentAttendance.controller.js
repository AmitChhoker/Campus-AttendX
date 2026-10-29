const studentAttendanceService = require("../../services/Student/studentAttendance.service");

// =====================================================
// GET MY ATTENDANCE
// =====================================================

const getMyAttendance = async (req, res, next) => {
    try {

        // The student ID comes from the authenticated JWT.
        // Never accept studentId from the query string for this endpoint.

        const studentId = req.user.id;

        const {
            semester,
            month,
            year,
            subjectId,
            startDate,
            endDate
        } = req.query;

        const attendanceData =
            await studentAttendanceService.getMyAttendance({
                studentId,
                semester,
                month,
                year,
                subjectId,
                startDate,
                endDate
            });

        return res.status(200).json({
            success: true,

            message:
                "Student attendance fetched successfully",

            data: attendanceData
        });

    } catch (error) {
        next(error);
    }
};
const getPreviousSemesters = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        
        // 1. Find all approved subjects for PREVIOUS semesters
        const subjects = await Subject.find({
            course: student.course,
            branch: student.branch,
            semester: { $lt: student.semester }, // Less than current semester
            status: "approved"
        });

        const semestersMap = new Map();

        // 2. Loop through each subject to get attendance
        for (const sub of subjects) {
            if (!semestersMap.has(sub.semester)) {
                semestersMap.set(sub.semester, { semester: sub.semester, subjects: [] });
            }

            const sessions = await AttendanceSession.find({ subject: sub._id, status: "closed" });
            const sessionIds = sessions.map(s => s._id);
            
            const attendedRecords = await Attendance.find({ 
                session: { $in: sessionIds }, 
                student: student._id 
            });
            const attendedIds = new Set(attendedRecords.map(a => a.session.toString()));

            let present = 0;
            const history = [];

            sessions.forEach(s => {
                const isPresent = attendedIds.has(s._id.toString());
                if (isPresent) present++;
                history.push({
                    date: s.startedAt,
                    status: isPresent ? "present" : "absent"
                });
            });

            const total = sessions.length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

            semestersMap.get(sub.semester).subjects.push({
                subjectName: sub.subjectName,
                subjectCode: sub.subjectCode,
                total,
                present,
                percentage: Number(percentage),
                history: history.sort((a,b) => new Date(b.date) - new Date(a.date)) // Latest first
            });
        }

        // 3. Calculate overall for each semester
        const result = Array.from(semestersMap.values()).map(sem => {
            let totalClasses = 0;
            let totalPresent = 0;
            sem.subjects.forEach(sub => {
                totalClasses += sub.total;
                totalPresent += sub.present;
            });
            return {
                semester: sem.semester,
                overallPercentage: totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(2)) : 0,
                totalClasses,
                totalPresent,
                subjects: sem.subjects
            };
        });

        res.json({ success: true, data: result.sort((a,b) => b.semester - a.semester) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// =====================================================
// EXPORT
// =====================================================
const getSubjectDetails = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        const subjectId = req.params.id;

        // 1. Subject ki details nikalein
        const subject = await Subject.findById(subjectId).populate("submittedBy", "firstName lastName");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        // 2. Is subject ke saare sessions nikalein (jo closed/expired hain)
        const sessions = await AttendanceSession.find({ 
            subject: subjectId, 
            status: { $in: ["closed", "expired"] } 
        }).populate("faculty", "firstName lastName").sort({ startedAt: -1 });

        // 3. Student ki attendance records nikalein
        const attendedRecords = await Attendance.find({ 
            student: student._id, 
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
                type: subject.type // Theory / Practical
            });
        });

        const total = sessions.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
        const neededToReach75 = total > 0 ? Math.ceil((0.75 * total) - present) : 0;

        res.json({
            success: true,
            data: {
                subject: {
                    id: subject._id,
                    name: subject.subjectName,
                    code: subject.subjectCode,
                    course: subject.course,
                    branch: subject.branch,
                    semester: subject.semester,
                    type: subject.type,
                    credits: subject.credits,
                    faculty: subject.submittedBy ? `${subject.submittedBy.firstName} ${subject.submittedBy.lastName}` : "N/A"
                },
                attendance: {
                    totalClasses: total,
                    present: present,
                    absent: total - present,
                    percentage: Number(percentage),
                    neededToReach75: neededToReach75 > 0 ? neededToReach75 : 0
                },
                history: history
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { semester, phone } = req.body;
        
        // Validation
        if (semester && (semester < 1 || semester > 8)) {
            return res.status(400).json({ success: false, message: "Semester must be between 1 and 8" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { semester: Number(semester), phone } },
            { new: true, runValidators: true }
        ).select("-password");

        res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// module.exports mein isko zaroor add karein:
// module.exports = { ..., updateProfile };
// module.exports mein updateProfile add karein

// module.exports mein add karein:
// getPreviousSemesters, getSubjectDetails
module.exports = {
    getMyAttendance,
    getPreviousSemesters,
    getSubjectDetails,
    updateProfile
};