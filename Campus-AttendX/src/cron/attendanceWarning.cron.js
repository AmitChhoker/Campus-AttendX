const cron = require("node-cron");
const User = require("../models/User");
const { generateAndSendReportCard } = require("../services/faculty/reportCard.service");

// Schedule: '0 0 1 */2 *' = At 00:00 on day-of-month 1 in every 2nd month.
// Testing ke liye: '*/5 * * * *' (Har 5 minute mein) use karein
const startAttendanceCron = () => {
  cron.schedule("0 0 1 */2 *", async () => {
    console.log("⏰ [CRON] Starting Bi-monthly Attendance Warning Job...");
    
    try {
      const students = await User.find({ role: "student", isActive: true });
      console.log(`Found ${students.length} active students.`);

      for (const student of students) {
        try {
          // Ye function khud check karega ki attendance < 75% hai ya nahi
          // Agar < 75% hogi tabhi SMS jayega (Email toh jayega hi).
          await generateAndSendReportCard(student._id);
        } catch (err) {
          console.error(`Failed for ${student.emailId}:`, err.message);
        }
      }
      console.log("✅ [CRON] Bi-monthly Job Completed.");
    } catch (err) {
      console.error("❌ [CRON] Job Failed:", err.message);
    }
  });
};

module.exports = { startAttendanceCron };