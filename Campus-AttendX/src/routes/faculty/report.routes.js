const { sendToSingleStudent, sendBulkReports } = require("../../controllers/faculty/reportCard.controller");

// Route to send single report
router.post(
  "/reports/send/:studentId",
  authMiddleware,
  roleMiddleware("faculty"),
  sendToSingleStudent
);

// Route to send bulk reports to a class
router.post(
  "/reports/send-bulk",
  authMiddleware,
  roleMiddleware("faculty"),
  sendBulkReports
);