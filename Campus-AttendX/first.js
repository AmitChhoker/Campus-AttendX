require("dotenv").config();
const cors = require("cors"); 
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// ==========================================
// 🔥 RENDER PROXY SETTING (Secure Cookies ke liye)
// ==========================================
app.set('trust proxy', 1); 

// ==========================================
// CORS SETUP (Sahi Origins ke saath)
// ==========================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://campus-attendx-lyart.vercel.app" // Purana URL (optional)
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.startsWith("http://localhost:") || origin.includes("vercel.app")) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Cookies allow karne ke liye
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(cookieParser());

// ==========================================
// DB + Redis
// ==========================================
const mongoDB = require("./src/db/database");
const redisClient = require("./src/config/redis");

// ==========================================
// ROUTES IMPORT
// ==========================================
// Auth
const recoveryRouter = require("./src/routes/recoveryRoutes");
const authRouter = require("./src/routes/auth.routes");

// Faculty
const subjectRouter = require("./src/routes/faculty/subject.routes");
const attendanceSessionRouter = require("./src/routes/faculty/attendanceSession.routes");
const facultySettingsRouter = require("./src/routes/faculty/facultySettings.routes");

// Google
const googleRouter = require("./src/routes/google.routes");

// Admin
const adminSubjectRouter = require("./src/routes/admin/adminSubject.routes");
const adminAttendanceRouter = require("./src/routes/admin/adminAttendance.routes");
const adminUserRouter = require("./src/routes/admin/adminUser.routes");
const adminDashboardRouter = require("./src/routes/admin/adminDashboard.routes");
const adminReportRouter = require("./src/routes/admin/adminReport.routes");
const adminNotificationRouter = require("./src/routes/admin/adminNotification.routes");
const adminProfileRouter = require("./src/routes/admin/adminProfile.routes");
const adminAuditRouter = require("./src/routes/admin/adminAudit.routes");

// Student
const studentDashboardRouter = require("./src/routes/student/studentDashboard.routes");
const studentAttendanceRouter = require("./src/routes/student/studentAttendance.routes");
const studentSubjectsRouter = require("./src/routes/student/studentSubjects.routes");
const studentNotificationRouter = require("./src/routes/student/studentNotification.routes");
const studentSettingsRouter = require("./src/routes/student/studentSettings.routes");
const studentScanAttendanceRouter = require("./src/routes/student/studentScanAttendance.routes");
const studentDeviceRouter = require("./src/routes/student/studentDevice.routes");
const studentRoutes = require("./src/routes/student/student.routes"); 

const { startAttendanceCron } = require("./src/cron/attendanceWarning.cron");

// ==========================================
// ROUTES DEFINITION
// ==========================================
// Public
app.use("/api/recovery", recoveryRouter);
app.use("/api/auth", authRouter);

// Faculty
app.use("/api/subjects", subjectRouter);
app.use("/api/attendance-sessions", attendanceSessionRouter);
app.use("/api/faculty/settings", facultySettingsRouter);

// Google
app.use("/api/google", googleRouter);

// Admin
app.use("/api/admin/subjects", adminSubjectRouter);
app.use("/api/admin/attendance", adminAttendanceRouter);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/reports", adminReportRouter);
app.use("/api/admin/dashboard/notifications", adminNotificationRouter);
app.use("/api/admin/profile", adminProfileRouter);
app.use("/api/admin/audit-logs", adminAuditRouter);

// Student
app.use("/api/student/dashboard", studentDashboardRouter);
app.use("/api/student/attendance", studentAttendanceRouter);
app.use("/api/student/subjects", studentSubjectsRouter);
app.use("/api/student/notifications", studentNotificationRouter);
app.use("/api/student/settings", studentSettingsRouter);
app.use("/api/student/scan-attendance", studentScanAttendanceRouter);
app.use("/api/student/device", studentDeviceRouter);
app.use("/api/student", studentRoutes); 

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Campus-AttendX Backend API is running successfully!"
    });
});

// Global Error Handler (Express v5)
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// ==========================================
// BOOT SERVER
// ==========================================
async function Initialization() {
    try {
        await Promise.all([mongoDB(), redisClient.connect()]);
        console.log("MongoDB and Redis connected successfully");

        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server listening at port ${PORT}`);
        });

        // Start the cron job after DB connects
        startAttendanceCron();
        console.log("Cron Job Scheduled for Bi-monthly Warnings");

    } catch (err) {
        console.error("Initialization failed:", err.message);
        process.exit(1);
    }
}

Initialization();