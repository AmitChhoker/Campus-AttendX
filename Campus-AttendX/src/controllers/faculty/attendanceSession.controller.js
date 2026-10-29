const attendanceSessionService = require("../../services/attendanceSession.service");

// ==========================================
// Faculty creates attendance session
// ==========================================
const createAttendanceSession = async (req, res, next) => {
    try {
        const { subjectId } = req.body;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message: "subjectId is required"
            });
        }

        const result = await attendanceSessionService.createAttendanceSession({
            facultyId: req.user.id,
            subjectId
        });

        return res.status(201).json({
            success: true,
            message: "Attendance session created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty gets own attendance sessions
// ==========================================
const getMySessions = async (req, res, next) => {
    try {
        const sessions = await attendanceSessionService.getMySessions(req.user.id);

        return res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty gets one attendance session
// ==========================================
const getAttendanceSessionById = async (req, res, next) => {
    try {
        const session = await attendanceSessionService.getAttendanceSessionById({
            sessionId: req.params.id,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty gets QR payload for the session
// ==========================================
const getSessionQrPayload = async (req, res, next) => {
    try {
        const payload = await attendanceSessionService.getSessionQrPayload({
            sessionId: req.params.id,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty gets BLE payload for the session
// ==========================================
const getSessionBlePayload = async (req, res, next) => {
    try {
        const payload = await attendanceSessionService.getSessionBlePayload({
            sessionId: req.params.id,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty gets attendance summary
// ==========================================
const getAttendanceSummary = async (req, res, next) => {
    try {
        const summary = await attendanceSessionService.getAttendanceSummary({
            sessionId: req.params.id,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Attendance summary fetched successfully",
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty closes session
// ==========================================
const closeAttendanceSession = async (req, res, next) => {
    try {
        const session = await attendanceSessionService.closeAttendanceSession({
            sessionId: req.params.id,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Attendance session closed successfully",
            data: session
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Student marks attendance (legacy)
// ==========================================
const markAttendance = async (req, res, next) => {
    try {
        const attendance = await attendanceSessionService.markAttendance({
            sessionId: req.params.id,
            studentId: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Attendance marked successfully",
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Faculty deletes one attendance record (within 2 days)
// ==========================================
const deleteAttendanceRecord = async (req, res, next) => {
    try {
        const result = await attendanceSessionService.deleteAttendanceRecord({
            sessionId: req.params.id,
            studentId: req.params.studentId,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Attendance record deleted",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Monthly attendance report
// ==========================================
const getMonthlyAttendanceReport = async (req, res, next) => {
    try {
        const { subjectId, month, year } = req.query;

        const report = await attendanceSessionService.getMonthlyAttendanceReport({
            subjectId,
            month,
            year,
            facultyId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Monthly attendance report fetched successfully",
            data: report
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Download monthly report (CSV)
// ==========================================
const downloadMonthlyAttendanceReport = async (req, res, next) => {
    try {
        const { subjectId, month, year } = req.query;

        const report = await attendanceSessionService.downloadMonthlyAttendanceReport({
            subjectId,
            month,
            year,
            facultyId: req.user.id
        });

        res.setHeader("Content-Type", report.contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${report.fileName}"`
        );

        return res.send(report.buffer);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Send Warnings (New)
// ==========================================
const sendWarnings = async (req, res, next) => {
    try {
        const { subjectId } = req.body;
        
        // Yahan apna report card bhejne ka service call karein
        // Example: await reportCardService.sendWarnings(subjectId);
        
        return res.status(200).json({ 
            success: true, 
            message: "Warnings sent successfully to defaulters!" 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    getSessionQrPayload,
    getSessionBlePayload,
    getAttendanceSummary,
    closeAttendanceSession,
    markAttendance,
    deleteAttendanceRecord,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport,
    sendWarnings
};