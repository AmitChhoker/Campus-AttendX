
const adminNotificationService = require("../../services/Admin/adminNotification.service");



// =====================================================
// GET ADMIN NOTIFICATIONS
// =====================================================

const getAdminNotifications =
    async (req, res, next) => {

        try {

            // -----------------------------------------
            // GET ADMIN BRANCH FROM AUTHENTICATION
            // -----------------------------------------

            const adminBranch =
                req.user.adminBranch;


            // -----------------------------------------
            // FETCH NOTIFICATIONS
            // -----------------------------------------

            const notifications =
                await adminNotificationService
                    .getAdminNotifications({

                        adminBranch

                    });


            // -----------------------------------------
            // SEND SUCCESS RESPONSE
            // -----------------------------------------

            return res.status(200).json({

                success: true,

                message:
                    "Admin notifications fetched successfully",

                data:
                    notifications

            });

        } catch (error) {

            // Pass errors to the global error handler
            next(error);

        }

    };


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAdminNotifications

};