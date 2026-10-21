const Subject = require("../../models/Subject");
const User = require("../../models/User");


// =====================================================
// ADMIN NOTIFICATION SERVICE
// =====================================================


// =====================================================
// HELPER: GET ADMIN BRANCH FILTER
// =====================================================

const getBranchFilter = (adminBranch) => {

    // Validate admin branch
    if (!adminBranch) {

        throw new Error(
            "Admin branch is not configured"
        );

    }

    // Super admin can access all branches
    if (adminBranch === "ALL") {

        return {};

    }

    // Branch-specific admin
    return {
        branch: adminBranch
    };

};


// =====================================================
// HELPER: FORMAT NOTIFICATION
// =====================================================

const createNotification = ({
    type,
    level,
    count,
    title,
    message,
    action
}) => {

    return {

        type,

        level,

        count,

        title,

        message,

        action

    };

};


// =====================================================
// GET ADMIN NOTIFICATIONS
// =====================================================

const getAdminNotifications = async ({
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
    // GET BRANCH FILTER
    // =================================================

    const branchFilter =
        getBranchFilter(adminBranch);


    // =================================================
    // BUILD USER FILTERS
    // =================================================

    const inactiveFacultyFilter = {

        role: "faculty",

        isActive: false,

        ...branchFilter

    };


    const inactiveStudentFilter = {

        role: "student",

        isActive: false,

        ...branchFilter

    };


    // =================================================
    // BUILD SUBJECT FILTERS
    // =================================================

    const pendingSubjectFilter = {

        status: "pending",

        ...branchFilter

    };


    // =================================================
    // FETCH NOTIFICATION DATA
    // =================================================

    const [

        pendingSubjects,

        inactiveFaculty,

        inactiveStudents,

        recentSubjects

    ] = await Promise.all([

        // ---------------------------------------------
        // PENDING SUBJECTS
        // ---------------------------------------------

        Subject.countDocuments(
            pendingSubjectFilter
        ),


        // ---------------------------------------------
        // INACTIVE FACULTY
        // ---------------------------------------------

        User.countDocuments(
            inactiveFacultyFilter
        ),


        // ---------------------------------------------
        // INACTIVE STUDENTS
        // ---------------------------------------------

        User.countDocuments(
            inactiveStudentFilter
        ),


        // ---------------------------------------------
        // RECENT SUBJECT SUBMISSIONS
        // ---------------------------------------------

        Subject.find(
            branchFilter
        )

        .populate(
            "submittedBy",
            "firstName lastName emailId"
        )

        .sort({
            createdAt: -1
        })

        .limit(5)

        .select(
            "_id subjectName subjectCode course branch semester status createdAt submittedBy"
        )

        .lean()

    ]);


    // =================================================
    // BUILD NOTIFICATION LIST
    // =================================================

    const notifications = [];


    // =================================================
    // 1. PENDING SUBJECT APPROVALS
    // =================================================

    if (pendingSubjects > 0) {

        notifications.push(

            createNotification({

                type: "pending_subjects",

                level: "warning",

                count: pendingSubjects,

                title:
                    "Pending Subject Approvals",

                message:
                    `${pendingSubjects} subjects are waiting for approval`,

                action:
                    "/admin/subjects/pending"

            })

        );

    }


    // =================================================
    // 2. INACTIVE FACULTY
    // =================================================

    if (inactiveFaculty > 0) {

        notifications.push(

            createNotification({

                type: "inactive_faculty",

                level: "info",

                count: inactiveFaculty,

                title:
                    "Inactive Faculty Accounts",

                message:
                    `${inactiveFaculty} faculty accounts are inactive`,

                action:
                    "/admin/users/faculty"

            })

        );

    }


    // =================================================
    // 3. INACTIVE STUDENTS
    // =================================================

    if (inactiveStudents > 0) {

        notifications.push(

            createNotification({

                type: "inactive_students",

                level: "info",

                count: inactiveStudents,

                title:
                    "Inactive Student Accounts",

                message:
                    `${inactiveStudents} student accounts are inactive`,

                action:
                    "/admin/users/students"

            })

        );

    }


    // =================================================
    // 4. RECENT SUBJECT SUBMISSIONS
    // =================================================

    if (recentSubjects.length > 0) {

        notifications.push(

            createNotification({

                type: "recent_subject_submissions",

                level: "info",

                count: recentSubjects.length,

                title:
                    "Recent Subject Submissions",

                message:
                    `${recentSubjects.length} recent subject submissions found`,

                action:
                    "/admin/subjects"

            })

        );

    }


    // =================================================
    // CALCULATE TOTAL NOTIFICATIONS
    // =================================================

    const totalNotifications =
        notifications.length;


    // =================================================
    // FORMAT RECENT SUBJECT SUBMISSIONS
    // =================================================

    const formattedRecentSubjects =
        recentSubjects.map(
            (subject) => ({

                id:
                    subject._id,

                subjectName:
                    subject.subjectName,

                subjectCode:
                    subject.subjectCode,

                course:
                    subject.course,

                branch:
                    subject.branch,

                semester:
                    subject.semester,

                status:
                    subject.status,

                submittedBy:
                    subject.submittedBy
                        ? {

                            id:
                                subject.submittedBy._id,

                            name:
                                `${subject.submittedBy.firstName} ${subject.submittedBy.lastName}`,

                            email:
                                subject.submittedBy.emailId

                        }
                        : null,

                createdAt:
                    subject.createdAt

            })
        );


    // =================================================
    // FINAL RESPONSE
    // =================================================

    return {

        adminScope: {

            branch:
                adminBranch

        },

        summary: {

            pendingSubjects,

            inactiveFaculty,

            inactiveStudents

        },

        totalNotifications,

        notifications,

        recentSubjects:
            formattedRecentSubjects

    };

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAdminNotifications

};