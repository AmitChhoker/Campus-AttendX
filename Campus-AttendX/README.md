University QR-Based Attendance Management System

A role-based university attendance management system designed to
simplify classroom attendance and make records easier to review. Faculty
start attendance sessions and display a dynamic QR code. Eligible
students scan it from the student dashboard, and the backend validates
the request before recording attendance.

Project status: In development. This README documents the project
idea, planned workflows, and route structure discussed during
development. Verify each feature in the repository before describing
it as complete or deployed.

Table of Contents

Project Idea

Goals

User Roles

Student Dashboard

Faculty Dashboard

Admin Dashboard

Attendance Workflow

Dynamic QR Design

Subject and Syllabus Workflow

Technology Stack

Backend Architecture

Main Data Models

API Overview

Environment Variables

Local Setup

Security Considerations

Future Improvements

License

Project Idea

The goal is to provide a digital attendance workflow for a university:

Faculty starts an attendance session for a subject.

The backend creates a time-limited session.

Faculty displays a dynamic QR code in the classroom.

An authenticated student scans the QR code.

The backend validates the QR token, session status and expiry,
student account, subject eligibility, and duplicate-attendance
status.

Attendance is recorded only if validation succeeds.

Students can review their attendance history and subject-wise
statistics.

Faculty and administrators manage the academic and attendance
workflows allowed by their roles.

The project uses one shared User model for students, faculty, and
administrators. Role-based middleware controls access to protected
endpoints. Academic eligibility is based on course, branch, and semester
rather than fixed classroom sections.

Goals

Reduce time spent taking attendance in class.

Maintain a clear record of attendance sessions and student
attendance.

Let students review their own attendance.

Prevent duplicate attendance records for the same student and
session.

Use short-lived QR tokens to reduce the usefulness of old
screenshots.

Provide a review process for faculty-submitted subjects and syllabus
files.

Keep the backend modular and maintainable.

User Roles

Student

The student dashboard is intended to let students:

Scan a classroom QR code to mark attendance.

View overall and subject-wise attendance.

Review attendance history and filter it by month, date, or subject.

View approved subjects matching their course, branch, and semester.

Access available syllabus files.

View, filter, read, and delete their notifications.

View personal and academic profile information.

Change their password and log out.

Students must not be able to access another student's records by
changing an ID in a request.

Faculty

Faculty functionality is intended to support:

Submitting subject details and a syllabus PDF for review.

Viewing submitted subjects and their approval status.

Starting and closing attendance sessions for authorized subjects.

Displaying the dynamic QR code for an active session.

Reviewing attendance information for their sessions.

Administrator

Administrator functionality is intended to support:

Reviewing faculty-submitted subjects.

Approving or rejecting submissions and recording review feedback.

Managing user accounts and academic data according to permissions.

Viewing dashboard summaries and attendance reports.

Applying university-wide or branch-scoped administrative permissions
where configured.

Student Dashboard

1. Dashboard Overview

Intended information:

Welcome message and student profile summary.

Overall attendance percentage.

Total classes attended and missed.

Subject-wise attendance for a selected month.

For each subject: total completed sessions, attended sessions,
missed sessions, and percentage.

Attendance calculations depend on which sessions the backend counts as
conducted. If cancelled classes must be excluded, the data model should
represent cancellation explicitly.

2. Scan Attendance

Scan the dynamic QR code displayed by faculty.

Submit the decoded session ID and QR token to the backend.

Validate the QR token and attendance session.

Check student account and academic eligibility.

Prevent duplicate attendance.

Display success or a clear error such as invalid QR, expired QR,
closed session, ineligible subject, or attendance already recorded.

The frontend must wait for the backend's response before showing
attendance as successfully recorded.

3. My Attendance

Overall attendance.

Subject-wise attendance summary.

Attendance history.

Month and date filters.

Optional subject filter.

Present/absent status for each completed session.

4. My Subjects

List approved and active subjects for the student's course, branch,
and semester.

View subject details such as name, code, credits, and type.

View syllabus information and download the file where permissions
allow it.

Do not present pending or rejected subjects as approved subjects.

5. Notifications

A shared Notification model is intended to support notifications for
all roles. Student features include:

List notifications, newest first.

Pagination.

Filter by notification type.

Filter unread notifications.

Get unread count.

Mark one notification as read.

Mark all notifications as read.

Delete a notification belonging to the authenticated student.

Possible notification events include attendance updates, subject status
changes, announcements, and system messages. The relevant business
workflow must create each notification; defining the model alone does
not generate notifications.

6. My Profile

Personal information - First name and last name. - Email and phone
number. - Profile image, if configured.

Academic information - Registration number. - Department. -
Course. - Branch. - Batch. - Semester.

Change password - Verify the current password. - Validate and
confirm the new password. - Hash the new password before saving. -
Invalidate the current token or require reauthentication according to
the authentication design.

Academic identifiers should not be freely editable by students through
the profile endpoint.

7. Logout

Invalidate the current JWT through the configured blacklist
mechanism, if enabled.

Clear the authentication cookie using matching cookie options.

Require authentication again before protected endpoints can be
accessed.

Clearing a cookie alone does not invalidate a copied token. The
authentication middleware must check the same blacklist mechanism used
by logout.

Faculty Dashboard

Subject Management

Submit subject information and a syllabus PDF.

Track pending, approved, or rejected submissions.

Review feedback and resubmit where supported.

Use approved subjects for attendance sessions.

Attendance Management

Start a session for an authorized subject.

Display the dynamic QR code.

Keep the session active for its configured duration.

Close a session when appropriate.

Review attendance records for the session.

The current session design uses a five-minute attendance-session
duration. The QR token has a separate, shorter validity window.

Admin Dashboard

Subject Review

View pending subject submissions.

Review subject details and syllabus references.

Approve or reject submissions.

Record the reviewer and review outcome.

User Management

View and manage student and faculty accounts according to
administrator permissions.

Support university-wide or branch-scoped access where configured.

Activate or deactivate accounts where implemented.

Dashboard and Reports

View system summaries.

Review attendance reports.

Filter reports using academic fields supported by the backend.

Monitor subject and attendance workflows.

Every administrative endpoint must enforce role and scope checks on the
server. Hiding a frontend button is not authorization.

Attendance Workflow

Faculty authenticates and selects an approved subject they are
permitted to use.

The backend creates a session containing the subject, faculty, start
time, expiry time, and status.

The faculty interface requests the current QR payload and displays
it.

An authenticated student scans the QR code.

The student client submits the session ID and QR token.

The backend validates the token and checks that the session is
active and not expired.

The backend checks that the student account is active and that the
student is eligible for the subject.

The backend checks for an existing attendance record.

The backend records attendance and returns the result.

A unique database index on (session, student) should prevent duplicate
records under concurrent requests. An application-level duplicate check
improves the error message but does not replace a unique index.

Dynamic QR Design

The current proposed QR utility uses a server-side secret and
HMAC-SHA256 token derived from the session ID and a time window. The
student-side implementation discussed during development uses a
20-second QR token interval, while the overall attendance session
lasts up to five minutes.

The payload contains:

sessionId

window

qrToken

expiresAt

The QR secret must remain on the backend and must never be sent to the
browser. The faculty QR generator and student validator must use the
same utility and configuration.

A rotating QR reduces the usefulness of old screenshots but does not
completely prevent proxy attendance: a screenshot may still be shared
during its valid window. The 20-second interval should be verified
against the faculty-side QR generator before the end-to-end feature is
considered complete.

Subject and Syllabus Workflow

Faculty submits subject details and a syllabus PDF.

The backend stores the submission with pending status.

An administrator reviews the submission.

The administrator approves or rejects it and may add feedback.

Approved, active subjects become available to eligible students and
attendance workflows.

Subject eligibility is matched using course, branch, and semester. The
project does not depend on fixed classroom sections.

Syllabus files may be stored in a cloud file service, with MongoDB
storing file metadata and a file ID or URL. A URL alone does not make a
private file downloadable; file permissions must be configured
correctly.

Technology Stack

Backend

Node.js --- JavaScript runtime.

Express.js --- HTTP API and routing.

MongoDB --- Document database.

Mongoose --- Schema definitions and database queries.

JWT --- Authentication.

bcrypt --- Password hashing.

Redis --- Token blacklist or session-related data, where
configured.

Multer --- File upload handling, where configured.

Google Drive integration --- Syllabus file storage, depending on
active configuration.

Frontend

The project is designed to work with a React-based dashboard. The
development context includes React and Vite.

Development and testing

Git and GitHub for version control.

Postman for API testing.

Environment variables for secrets and deployment-specific
configuration.

Backend Architecture

src/
├── config/                 # Database and service configuration
├── models/                 # Mongoose models
├── middleware/             # Authentication, roles, validation
├── routes/
│   ├── admin/
│   ├── faculty/
│   └── student/
├── controllers/
│   ├── admin/
│   ├── faculty/
│   └── student/
├── services/
│   ├── admin/
│   ├── faculty/
│   ├── student/
│   └── notification/
├── utils/                  # Shared helpers, e.g. dynamic QR utility
└── app.js or server.js     # Application entry point

Actual filenames may differ from this illustrative structure.

Models define stored data.

Routes define API paths and middleware.

Controllers handle HTTP requests and responses.

Services contain business logic.

Middleware protects endpoints and enforces role-based access.

Utilities contain reusable logic such as QR token generation and
validation.

Main Data Models

User

One shared model for student, faculty, and admin accounts. Depending on
role, it may store name, email, phone, password hash, role, account
status, and academic fields such as registration number, department,
course, branch, batch, and semester.

Subject

Stores subject name and code, course, branch, semester, credits, type,
syllabus metadata/reference, submission status, submitter, reviewer,
review details, and active status.

AttendanceSession

Represents a faculty-created session, including subject and faculty
references, session code or identifier, start and expiry timestamps,
status (active, closed, or expired), and close timestamp where
applicable.

Attendance

Stores the session reference, student reference, marked timestamp, and
attendance status. A unique (session, student) index should enforce
one attendance record per student per session.

Notification

A shared notification model for any user. It can contain recipient,
title, message, type, priority, read status, read timestamp, optional
action URL, related record ID, creator, and timestamps.

The actual schema in the repository is authoritative; update this
section when models change.

API Overview

These paths reflect the route structure and student endpoints discussed
during development. Check the actual server registrations before
treating each endpoint as implemented or deployed.

Backend route mounts in the current design

Area                       Base path

Recovery                   /api/recovery
Authentication             /api
Subjects                   /api/subjects
Admin subject management   /api/admin/subjects
Google integration         /api/google
Attendance sessions        /api/attendance-sessions
Faculty settings           /api/faculty/settings
Admin attendance           /api/admin/attendance
Admin users                /api/admin/users
Admin dashboard            /api/admin/dashboard
Admin reports              /api/admin/reports

Student dashboard endpoints designed

Feature                 Method                  Path

Dashboard overview      GET                     /api/student/dashboard

Attendance              GET                     /api/student/attendance
summary/history

List subjects           GET                     /api/student/subjects

Subject details         GET                     /api/student/subjects/:subjectId

Download syllabus       GET                     /api/student/subjects/:subjectId/syllabus

List notifications      GET                     /api/student/notifications

Unread notification     GET                     /api/student/notifications/unread-count
count

Mark notification as    PATCH                   /api/student/notifications/:notificationId/read
read

Mark all notifications  PATCH                   /api/student/notifications/read-all
as read

Delete notification     DELETE                  /api/student/notifications/:notificationId

Get profile             GET                     /api/student/settings/profile

Change password         PATCH                   /api/student/settings/change-password

Logout                  POST                    /api/student/settings/logout

Scan attendance         POST                    /api/student/scan-attendance/scan

Query parameters and response formats depend on the implementation. Some
student routes may still need to be added to the application entry
point.

Environment Variables

Create a local .env file in the backend root. Never commit real
credentials or production secrets.

PORT=4000

# Use the exact names expected by your configuration
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

QR_SECRET_KEY=your_long_random_qr_secret

# Optional Google Drive configuration
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=

These are example names; check the existing configuration files and use
their exact variable names. Do not publish .env values.

Generate a strong QR secret with Node.js:

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Local Setup

Prerequisites

A supported Node.js version and npm.

MongoDB locally or a MongoDB connection string.

Redis if required by the current configuration.

Git.

Postman or another API client.

1. Clone the repository

git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_DIRECTORY

Replace the placeholders with the actual repository URL and directory.

2. Install dependencies

Run from the backend directory:

npm install

3. Configure environment variables

Create .env in the backend root and add the values required by the
existing configuration.

4. Start required services

Make sure MongoDB is reachable. Start Redis if authentication or another
configured service depends on it.

5. Start the backend

Use the script available in package.json, for example:

npm run dev

or:

npm start

These commands work only if the corresponding scripts exist.

6. Test the attendance flow

Authenticate as faculty.

Create a valid attendance session using the faculty workflow.

Generate a current QR payload using the backend utility.

Authenticate as an eligible student.

Submit the QR payload to the student scan endpoint.

Verify that attendance is saved once and duplicate attempts are
rejected.

Security Considerations

Store password hashes, never plaintext passwords.

Keep JWT and QR secrets on the backend.

Authenticate protected routes and enforce role authorization.

Derive the student's identity from verified authentication context,
not an arbitrary body parameter.

Check notification ownership before reading, updating, or deleting.

Check academic eligibility before recording attendance.

Validate QR-token validity and session status/expiry.

Enforce duplicate prevention with a database unique index.

Validate request parameters and uploaded files.

Configure CORS and cookies appropriately for deployment.

Use rate limiting and safe error responses for sensitive endpoints.

Never log passwords, secrets, or authentication tokens.

Ensure syllabus downloads respect file permissions.

Handle notification failures so they do not silently reverse an
already-saved attendance record.

A dynamic QR code cannot alone guarantee that the person scanning is
physically present. Consider additional anti-abuse controls based on
usability, privacy, and university requirements.

Future Improvements

Complete and test the React camera scanner.

Integrate faculty QR display with the same server-side utility used
by student validation.

Evaluate stronger anti-proxy controls.

Connect notification generation to attendance and subject-review
workflows.

Improve reports and export options.

Add tests for authorization, QR expiry, duplicate attendance, and
academic eligibility.

Document API request/response schemas.

Add deployment, logging, monitoring, and backup guidance.

Represent cancelled classes explicitly so they are not counted as
conducted sessions.

License

No license has been specified yet. Add a LICENSE file and update this
section before distributing the project if you intend to use an
open-source license.