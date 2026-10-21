const AttendanceSession =require("../../models/AttendanceSession");

const Attendance = require("../../models/Attendance");

const Subject = require("../../models/Subject");

const User = require("../../models/User");


// =====================================================
// ADMIN MONTHLY ATTENDANCE REPORT
// =====================================================

const getMonthlyAttendanceReport = async ({
    month,
    year,
    course,
    branch,
    semester,
    subjectId,
    adminBranch
}) => {

    // =================================================
    // VALIDATE ADMIN BRANCH
    // =================================================

    if (!adminBranch) {

        throw new Error(
            "Admin branch is not configured"
        );

    }


    // =================================================
    // VALIDATE MONTH
    // =================================================

    const selectedMonth =
        Number(month);

    const selectedYear =
        Number(year);


    if (
        !selectedMonth ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {

        throw new Error(
            "Invalid month"
        );

    }


    // =================================================
    // VALIDATE YEAR
    // =================================================

    if (
        !selectedYear ||
        selectedYear < 2000
    ) {

        throw new Error(
            "Invalid year"
        );

    }


    // =================================================
    // ADMIN BRANCH SECURITY
    // =================================================

    if (
        adminBranch !== "ALL" &&
        branch &&
        branch !== adminBranch
    ) {

        throw new Error(
            "You are not authorized to access this branch"
        );

    }


    // =================================================
    // DETERMINE EFFECTIVE BRANCH
    // =================================================

    const effectiveBranch =
        adminBranch === "ALL"
            ? branch || null
            : adminBranch;


    // =================================================
    // START AND END OF MONTH
    // =================================================

    const startDate =
        new Date(
            selectedYear,
            selectedMonth - 1,
            1
        );


    const endDate =
        new Date(
            selectedYear,
            selectedMonth,
            1
        );


    // =================================================
    // MONTH COMPLETION CHECK
    // =================================================

    const now =
        new Date();


    // Future month
    if (startDate > now) {

        throw new Error(
            "Future month attendance report is not available"
        );

    }


    // Current incomplete month
    if (now < endDate) {

        throw new Error(
            "Monthly attendance report is available only after the selected month has been completed"
        );

    }


    // =================================================
    // BUILD SUBJECT FILTER
    // =================================================

    const subjectFilter = {};


    // Only approved active subjects
    subjectFilter.status =
        "approved";

    subjectFilter.isActive =
        true;


    // Branch restriction
    if (effectiveBranch) {

        subjectFilter.branch =
            effectiveBranch;

    }


    // Course filter
    if (course) {

        subjectFilter.course =
            course;

    }


    // Semester filter
    if (semester) {

        const selectedSemester =
            Number(semester);


        if (
            !Number.isInteger(
                selectedSemester
            ) ||
            selectedSemester < 1 ||
            selectedSemester > 8
        ) {

            throw new Error(
                "Invalid semester"
            );

        }


        subjectFilter.semester =
            selectedSemester;

    }


    // Specific subject
    if (subjectId) {

        subjectFilter._id =
            subjectId;

    }


    // =================================================
    // FIND SUBJECTS
    // =================================================

    const subjects =
        await Subject.find(
            subjectFilter
        )
        .select(
            "_id subjectName subjectCode course branch semester"
        )
        .sort({
            course: 1,
            branch: 1,
            semester: 1,
            subjectName: 1
        })
        .lean();


    if (!subjects.length) {

        return {

            month:
                selectedMonth,

            year:
                selectedYear,

            filters: {

                course:
                    course || null,

                branch:
                    effectiveBranch,

                semester:
                    semester
                        ? Number(semester)
                        : null,

                subjectId:
                    subjectId || null

            },

            totalSubjects: 0,

            reports: []

        };

    }


    // =================================================
    // GENERATE REPORT FOR EACH SUBJECT
    // =================================================

    const reports =
        await Promise.all(

            subjects.map(
                async subject => {

                    // ---------------------------------
                    // FIND CLASSES CONDUCTED
                    // ---------------------------------

                    const sessions =
                        await AttendanceSession.find({

                            subject:
                                subject._id,

                            startedAt: {

                                $gte:
                                    startDate,

                                $lt:
                                    endDate

                            }

                        })
                        .select(
                            "_id startedAt"
                        )
                        .sort({
                            startedAt: 1
                        })
                        .lean();


                    const totalClassesConducted =
                        sessions.length;


                    // ---------------------------------
                    // FIND ELIGIBLE STUDENTS
                    // ---------------------------------

                    const students =
                        await User.find({

                            role: "student",

                            isActive: true,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester

                        })
                        .select(
                            "firstName lastName registrationNumber"
                        )
                        .sort({
                            registrationNumber: 1
                        })
                        .lean();


                    // ---------------------------------
                    // NO CLASSES
                    // ---------------------------------

                    if (
                        totalClassesConducted === 0
                    ) {

                        return {

                            subject: {

                                id:
                                    subject._id,

                                name:
                                    subject.subjectName,

                                code:
                                    subject.subjectCode,

                                course:
                                    subject.course,

                                branch:
                                    subject.branch,

                                semester:
                                    subject.semester

                            },

                            totalClassesConducted: 0,

                            totalStudents:
                                students.length,

                            studentsBelow75: 0,

                            students:
                                students.map(
                                    student => ({

                                        studentId:
                                            student._id,

                                        registrationNumber:
                                            student.registrationNumber,

                                        name:
                                            `${student.firstName} ${student.lastName}`,

                                        classesConducted: 0,

                                        present: 0,

                                        absent: 0,

                                        attendancePercentage:
                                            null,

                                        below75:
                                            false

                                    })
                                )

                        };

                    }


                    // ---------------------------------
                    // SESSION IDS
                    // ---------------------------------

                    const sessionIds =
                        sessions.map(
                            session =>
                                session._id
                        );


                    // ---------------------------------
                    // GET ATTENDANCE RECORDS
                    // ---------------------------------

                    const attendanceRecords =
                        await Attendance.find({

                            session: {

                                $in:
                                    sessionIds

                            },

                            status:
                                "present"

                        })
                        .select(
                            "student session"
                        )
                        .lean();


                    // ---------------------------------
                    // COUNT ATTENDANCE
                    // ---------------------------------

                    const attendanceCount =
                        new Map();


                    for (
                        const record
                        of attendanceRecords
                    ) {

                        const studentId =
                            record.student.toString();


                        const currentCount =
                            attendanceCount.get(
                                studentId
                            ) || 0;


                        attendanceCount.set(

                            studentId,

                            currentCount + 1

                        );

                    }


                    // ---------------------------------
                    // CREATE STUDENT REPORT
                    // ---------------------------------

                    const studentReports =
                        students.map(
                            student => {

                                const studentId =
                                    student._id.toString();


                                const present =
                                    attendanceCount.get(
                                        studentId
                                    ) || 0;


                                const absent =
                                    Math.max(
                                        totalClassesConducted -
                                        present,
                                        0
                                    );


                                const attendancePercentage =
                                    Number(

                                        (
                                            (
                                                present /
                                                totalClassesConducted
                                            ) * 100

                                        ).toFixed(2)

                                    );


                                return {

                                    studentId:
                                        student._id,

                                    registrationNumber:
                                        student.registrationNumber,

                                    name:
                                        `${student.firstName} ${student.lastName}`,

                                    classesConducted:
                                        totalClassesConducted,

                                    present,

                                    absent,

                                    attendancePercentage,

                                    below75:
                                        attendancePercentage < 75

                                };

                            }
                        );


                    // ---------------------------------
                    // COUNT BELOW 75%
                    // ---------------------------------

                    const studentsBelow75 =
                        studentReports.filter(
                            student =>
                                student.below75
                        ).length;


                    // ---------------------------------
                    // RETURN SUBJECT REPORT
                    // ---------------------------------

                    return {

                        subject: {

                            id:
                                subject._id,

                            name:
                                subject.subjectName,

                            code:
                                subject.subjectCode,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester

                        },

                        totalClassesConducted,

                        totalStudents:
                            students.length,

                        studentsBelow75,

                        students:
                            studentReports

                    };

                }

            )

        );


    // =================================================
    // FINAL RESPONSE
    // =================================================

    return {

        month:
            selectedMonth,

        year:
            selectedYear,

        filters: {

            course:
                course || null,

            branch:
                effectiveBranch,

            semester:
                semester
                    ? Number(semester)
                    : null,

            subjectId:
                subjectId || null

        },

        totalSubjects:
            reports.length,

        reports

    };

};

// =====================================================
// ADMIN LOW ATTENDANCE REPORT
// SUBJECT-WISE
// =====================================================

const getLowAttendanceReport = async ({
    month,
    year,
    course,
    branch,
    semester,
    subjectId,
    threshold = 75,
    adminBranch
}) => {

    // =================================================
    // VALIDATE ADMIN BRANCH
    // =================================================

    if (!adminBranch) {

        throw new Error(
            "Admin branch is not configured"
        );

    }


    // =================================================
    // VALIDATE MONTH
    // =================================================

    const selectedMonth =
        Number(month);

    const selectedYear =
        Number(year);


    if (
        !selectedMonth ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {

        throw new Error(
            "Invalid month"
        );

    }


    // =================================================
    // VALIDATE YEAR
    // =================================================

    if (
        !selectedYear ||
        selectedYear < 2000
    ) {

        throw new Error(
            "Invalid year"
        );

    }


    // =================================================
    // VALIDATE THRESHOLD
    // =================================================

    const selectedThreshold =
        Number(threshold);


    if (
        Number.isNaN(selectedThreshold) ||
        selectedThreshold < 0 ||
        selectedThreshold > 100
    ) {

        throw new Error(
            "Invalid attendance threshold"
        );

    }


    // =================================================
    // ADMIN BRANCH SECURITY
    // =================================================

    if (
        adminBranch !== "ALL" &&
        branch &&
        branch !== adminBranch
    ) {

        throw new Error(
            "You are not authorized to access this branch"
        );

    }


    // =================================================
    // DETERMINE EFFECTIVE BRANCH
    // =================================================

    const effectiveBranch =
        adminBranch === "ALL"
            ? branch || null
            : adminBranch;


    // =================================================
    // START AND END OF MONTH
    // =================================================

    const startDate =
        new Date(
            selectedYear,
            selectedMonth - 1,
            1
        );


    const endDate =
        new Date(
            selectedYear,
            selectedMonth,
            1
        );


    // =================================================
    // MONTH COMPLETION CHECK
    // =================================================

    const now =
        new Date();


    // Future month
    if (startDate > now) {

        throw new Error(
            "Future month attendance report is not available"
        );

    }


    // Current incomplete month
    if (now < endDate) {

        throw new Error(
            "Low attendance report is available only after the selected month has been completed"
        );

    }


    // =================================================
    // BUILD SUBJECT FILTER
    // =================================================

    const subjectFilter = {

        status: "approved",

        isActive: true

    };


    // Branch restriction
    if (effectiveBranch) {

        subjectFilter.branch =
            effectiveBranch;

    }


    // Course filter
    if (course) {

        subjectFilter.course =
            course;

    }


    // Semester filter
    if (semester) {

        const selectedSemester =
            Number(semester);


        if (
            !Number.isInteger(
                selectedSemester
            ) ||
            selectedSemester < 1 ||
            selectedSemester > 8
        ) {

            throw new Error(
                "Invalid semester"
            );

        }


        subjectFilter.semester =
            selectedSemester;

    }


    // Specific subject
    if (subjectId) {

        subjectFilter._id =
            subjectId;

    }


    // =================================================
    // FIND SUBJECTS
    // =================================================

    const subjects =
        await Subject.find(
            subjectFilter
        )
        .select(
            "_id subjectName subjectCode course branch semester"
        )
        .sort({
            course: 1,
            branch: 1,
            semester: 1,
            subjectName: 1
        })
        .lean();


    // =================================================
    // NO SUBJECTS
    // =================================================

    if (!subjects.length) {

        return {

            month:
                selectedMonth,

            year:
                selectedYear,

            threshold:
                selectedThreshold,

            filters: {

                course:
                    course || null,

                branch:
                    effectiveBranch,

                semester:
                    semester
                        ? Number(semester)
                        : null,

                subjectId:
                    subjectId || null

            },

            totalSubjects: 0,

            totalLowAttendanceRecords: 0,

            reports: []

        };

    }


    // =================================================
    // GENERATE LOW ATTENDANCE REPORT
    // FOR EACH SUBJECT
    // =================================================

    const reports =
        await Promise.all(

            subjects.map(
                async subject => {

                    // ---------------------------------
                    // FIND CLASSES CONDUCTED
                    // ---------------------------------

                    const sessions =
                        await AttendanceSession.find({

                            subject:
                                subject._id,

                            startedAt: {

                                $gte:
                                    startDate,

                                $lt:
                                    endDate

                            }

                        })
                        .select(
                            "_id startedAt"
                        )
                        .sort({
                            startedAt: 1
                        })
                        .lean();


                    const totalClassesConducted =
                        sessions.length;


                    // ---------------------------------
                    // FIND ELIGIBLE STUDENTS
                    // ---------------------------------

                    const students =
                        await User.find({

                            role: "student",

                            isActive: true,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester

                        })
                        .select(
                            "firstName lastName registrationNumber"
                        )
                        .sort({
                            registrationNumber: 1
                        })
                        .lean();


                    // ---------------------------------
                    // NO CLASSES
                    // ---------------------------------

                    if (
                        totalClassesConducted === 0
                    ) {

                        return {

                            subject: {

                                id:
                                    subject._id,

                                name:
                                    subject.subjectName,

                                code:
                                    subject.subjectCode,

                                course:
                                    subject.course,

                                branch:
                                    subject.branch,

                                semester:
                                    subject.semester

                            },

                            totalClassesConducted: 0,

                            totalStudents:
                                students.length,

                            studentsBelowThreshold: 0,

                            students: []

                        };

                    }


                    // ---------------------------------
                    // SESSION IDS
                    // ---------------------------------

                    const sessionIds =
                        sessions.map(
                            session =>
                                session._id
                        );


                    // ---------------------------------
                    // GET ATTENDANCE RECORDS
                    // ---------------------------------

                    const attendanceRecords =
                        await Attendance.find({

                            session: {

                                $in:
                                    sessionIds

                            },

                            status:
                                "present"

                        })
                        .select(
                            "student session"
                        )
                        .lean();


                    // ---------------------------------
                    // COUNT ATTENDANCE
                    // ---------------------------------

                    const attendanceCount =
                        new Map();


                    for (
                        const record
                        of attendanceRecords
                    ) {

                        const studentId =
                            record.student.toString();


                        const currentCount =
                            attendanceCount.get(
                                studentId
                            ) || 0;


                        attendanceCount.set(

                            studentId,

                            currentCount + 1

                        );

                    }


                    // ---------------------------------
                    // CREATE LOW ATTENDANCE REPORT
                    // ---------------------------------

                    const lowAttendanceStudents =
                        students
                            .map(
                                student => {

                                    const studentId =
                                        student._id.toString();


                                    const present =
                                        attendanceCount.get(
                                            studentId
                                        ) || 0;


                                    const absent =
                                        Math.max(

                                            totalClassesConducted -
                                            present,

                                            0

                                        );


                                    const attendancePercentage =
                                        Number(

                                            (
                                                (
                                                    present /
                                                    totalClassesConducted
                                                ) * 100

                                            ).toFixed(2)

                                        );


                                    return {

                                        studentId:
                                            student._id,

                                        registrationNumber:
                                            student.registrationNumber,

                                        name:
                                            `${student.firstName} ${student.lastName}`,

                                        classesConducted:
                                            totalClassesConducted,

                                        present,

                                        absent,

                                        attendancePercentage

                                    };

                                }
                            )
                            .filter(
                                student =>
                                    student.attendancePercentage <
                                    selectedThreshold
                            );


                    // ---------------------------------
                    // RETURN SUBJECT REPORT
                    // ---------------------------------

                    return {

                        subject: {

                            id:
                                subject._id,

                            name:
                                subject.subjectName,

                            code:
                                subject.subjectCode,

                            course:
                                subject.course,

                            branch:
                                subject.branch,

                            semester:
                                subject.semester

                        },

                        totalClassesConducted,

                        totalStudents:
                            students.length,

                        studentsBelowThreshold:
                            lowAttendanceStudents.length,

                        students:
                            lowAttendanceStudents

                    };

                }

            )

        );


    // =================================================
    // COUNT TOTAL LOW ATTENDANCE RECORDS
    // =================================================

    const totalLowAttendanceRecords =
        reports.reduce(

            (total, report) =>
                total +
                report.studentsBelowThreshold,

            0

        );


    // =================================================
    // FINAL RESPONSE
    // =================================================

    return {

        month:
            selectedMonth,

        year:
            selectedYear,

        threshold:
            selectedThreshold,

        filters: {

            course:
                course || null,

            branch:
                effectiveBranch,

            semester:
                semester
                    ? Number(semester)
                    : null,

            subjectId:
                subjectId || null

        },

        totalSubjects:
            reports.length,

        totalLowAttendanceRecords,

        reports

    };

};

// =====================================================
// ADMIN MONTHLY FACULTY ACTIVITY REPORT
// SUBJECT-WISE
// =====================================================

const getFacultyActivityReport = async ({
    month,
    year,
    course,
    branch,
    semester,
    facultyId,
    subjectId,
    adminBranch
}) => {

    // =================================================
    // VALIDATE ADMIN BRANCH
    // =================================================

    if (!adminBranch) {

        throw new Error(
            "Admin branch is not configured"
        );

    }


    // =================================================
    // VALIDATE MONTH
    // =================================================

    const selectedMonth =
        Number(month);

    const selectedYear =
        Number(year);


    if (
        !Number.isInteger(selectedMonth) ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {

        throw new Error(
            "Invalid month"
        );

    }


    // =================================================
    // VALIDATE YEAR
    // =================================================

    if (
        !Number.isInteger(selectedYear) ||
        selectedYear < 2000
    ) {

        throw new Error(
            "Invalid year"
        );

    }


    // =================================================
    // ADMIN BRANCH SECURITY
    // =================================================

    if (
        adminBranch !== "ALL" &&
        branch &&
        branch !== adminBranch
    ) {

        throw new Error(
            "You are not authorized to access this branch"
        );

    }


    // =================================================
    // DETERMINE EFFECTIVE BRANCH
    // =================================================

    const effectiveBranch =
        adminBranch === "ALL"
            ? branch || null
            : adminBranch;


    // =================================================
    // VALIDATE COURSE
    // =================================================

    const allowedCourses = [
        "B.TECH",
        "BCA",
        "DIPLOMA"
    ];

    if (
        course &&
        !allowedCourses.includes(course)
    ) {

        throw new Error(
            "Invalid course"
        );

    }


    // =================================================
    // VALIDATE SEMESTER
    // =================================================

    let selectedSemester = null;

    if (
        semester !== undefined &&
        semester !== null &&
        semester !== ""
    ) {

        selectedSemester =
            Number(semester);


        if (
            !Number.isInteger(
                selectedSemester
            ) ||
            selectedSemester < 1 ||
            selectedSemester > 8
        ) {

            throw new Error(
                "Invalid semester"
            );

        }

    }


    // =================================================
    // START AND END OF MONTH
    // =================================================

    const startDate =
        new Date(
            selectedYear,
            selectedMonth - 1,
            1
        );


    const endDate =
        new Date(
            selectedYear,
            selectedMonth,
            1
        );


    // =================================================
    // MONTH COMPLETION CHECK
    // =================================================

    const now =
        new Date();


    // Future month
    if (startDate > now) {

        throw new Error(
            "Future month faculty activity report is not available"
        );

    }


    // Current incomplete month
    if (now < endDate) {

        throw new Error(
            "Faculty activity report is available only after the selected month has been completed"
        );

    }


    // =================================================
    // BUILD SUBJECT FILTER
    // =================================================

    const subjectFilter = {

        status: "approved",

        isActive: true

    };


    // Branch restriction
    if (effectiveBranch) {

        subjectFilter.branch =
            effectiveBranch;

    }


    // Course filter
    if (course) {

        subjectFilter.course =
            course;

    }


    // Semester filter
    if (selectedSemester) {

        subjectFilter.semester =
            selectedSemester;

    }


    // Specific subject
    if (subjectId) {

        subjectFilter._id =
            subjectId;

    }


    // =================================================
    // FIND SUBJECTS
    // =================================================

    const subjects =
        await Subject.find(
            subjectFilter
        )
        .select(
            "_id subjectName subjectCode course branch semester"
        )
        .sort({
            course: 1,
            branch: 1,
            semester: 1,
            subjectName: 1
        })
        .lean();


    // =================================================
    // NO SUBJECTS
    // =================================================

    if (!subjects.length) {

        return {

            month:
                selectedMonth,

            year:
                selectedYear,

            filters: {

                course:
                    course || null,

                branch:
                    effectiveBranch,

                semester:
                    selectedSemester,

                facultyId:
                    facultyId || null,

                subjectId:
                    subjectId || null

            },

            totalFaculty: 0,

            totalSubjects: 0,

            totalSessions: 0,

            reports: []

        };

    }


    // =================================================
    // GENERATE FACULTY ACTIVITY REPORT
    // =================================================

    const reports = [];


    for (
        const subject of subjects
    ) {

        // ---------------------------------------------
        // FIND SESSIONS CONDUCTED
        // ---------------------------------------------

        const sessionFilter = {

            subject:
                subject._id,

            startedAt: {

                $gte:
                    startDate,

                $lt:
                    endDate

            }

        };


        // Optional faculty filter
        if (facultyId) {

            sessionFilter.faculty =
                facultyId;

        }


        const sessions =
            await AttendanceSession.find(
                sessionFilter
            )
            .select(
                "_id faculty startedAt"
            )
            .sort({
                startedAt: 1
            })
            .lean();


        // ---------------------------------------------
        // NO SESSION
        // ---------------------------------------------

        if (!sessions.length) {

            continue;

        }


        // ---------------------------------------------
        // GROUP SESSIONS BY FACULTY
        // ---------------------------------------------

        const facultyMap =
            new Map();


        for (
            const session of sessions
        ) {

            const currentFacultyId =
                session.faculty.toString();


            if (
                !facultyMap.has(
                    currentFacultyId
                )
            ) {

                facultyMap.set(
                    currentFacultyId,
                    {
                        facultyId:
                            session.faculty,

                        sessionsConducted: 0,

                        lastSession: null
                    }
                );

            }


            const activity =
                facultyMap.get(
                    currentFacultyId
                );


            activity.sessionsConducted += 1;


            if (
                !activity.lastSession ||
                new Date(
                    session.startedAt
                ) >
                new Date(
                    activity.lastSession
                )
            ) {

                activity.lastSession =
                    session.startedAt;

            }

        }


        // ---------------------------------------------
        // GET FACULTY DETAILS
        // ---------------------------------------------

        const facultyIds =
            Array.from(
                facultyMap.values()
            )
            .map(
                activity =>
                    activity.facultyId
            );


        const facultyUsers =
            await User.find({

                _id: {
                    $in: facultyIds
                },

                role: "faculty",

                isActive: true

            })
            .select(
                "_id firstName lastName emailId course branch"
            )
            .lean();


        const facultyDetailsMap =
            new Map(
                facultyUsers.map(
                    faculty => [
                        faculty._id.toString(),
                        faculty
                    ]
                )
            );


        // ---------------------------------------------
        // CREATE REPORT ROWS
        // ---------------------------------------------

        for (
            const activity of facultyMap.values()
        ) {

            const faculty =
                facultyDetailsMap.get(
                    activity.facultyId.toString()
                );


            if (!faculty) {

                continue;

            }


            reports.push({

                faculty: {

                    id:
                        faculty._id,

                    name:
                        `${faculty.firstName} ${faculty.lastName}`,

                    emailId:
                        faculty.emailId

                },

                subject: {

                    id:
                        subject._id,

                    name:
                        subject.subjectName,

                    code:
                        subject.subjectCode

                },

                academicGroup: {

                    course:
                        subject.course,

                    branch:
                        subject.branch,

                    semester:
                        subject.semester

                },

                sessionsConducted:
                    activity.sessionsConducted,

                lastSession:
                    activity.lastSession

            });

        }

    }


    // =================================================
    // SORT REPORT
    // =================================================

    reports.sort(
        (a, b) => {

            if (
                a.academicGroup.course !==
                b.academicGroup.course
            ) {

                return a.academicGroup.course
                    .localeCompare(
                        b.academicGroup.course
                    );

            }


            if (
                a.academicGroup.branch !==
                b.academicGroup.branch
            ) {

                return a.academicGroup.branch
                    .localeCompare(
                        b.academicGroup.branch
                    );

            }


            if (
                a.academicGroup.semester !==
                b.academicGroup.semester
            ) {

                return (
                    a.academicGroup.semester -
                    b.academicGroup.semester
                );

            }


            if (
                a.faculty.name !==
                b.faculty.name
            ) {

                return a.faculty.name
                    .localeCompare(
                        b.faculty.name
                    );

            }


            return a.subject.name
                .localeCompare(
                    b.subject.name
                );

        }
    );


    // =================================================
    // CALCULATE TOTALS
    // =================================================

    const facultySet =
        new Set();

    const subjectSet =
        new Set();

    let totalSessions = 0;


    for (
        const report of reports
    ) {

        facultySet.add(
            report.faculty.id.toString()
        );


        subjectSet.add(
            report.subject.id.toString()
        );


        totalSessions +=
            report.sessionsConducted;

    }


    // =================================================
    // FINAL RESPONSE
    // =================================================

    return {

        month:
            selectedMonth,

        year:
            selectedYear,

        filters: {

            course:
                course || null,

            branch:
                effectiveBranch,

            semester:
                selectedSemester,

            facultyId:
                facultyId || null,

            subjectId:
                subjectId || null

        },

        totalFaculty:
            facultySet.size,

        totalSubjects:
            subjectSet.size,

        totalSessions,

        reports

    };

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getMonthlyAttendanceReport,
    getLowAttendanceReport,
    getFacultyActivityReport


};