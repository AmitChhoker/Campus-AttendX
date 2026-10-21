
const adminDashboardService = require("../../services/Admin/adminDashboard.service");



// =====================================================
// GET ADMIN DASHBOARD
// =====================================================

const getDashboard =
    async (req, res, next) => {

        try {

            const result =
                await adminDashboardService
                    .getDashboard({

                        adminBranch:
                            req.user.adminBranch

                    });


            return res.status(200).json({

                success: true,

                message:
                    "Admin dashboard fetched successfully",

                data:
                    result

            });

        } catch (error) {

            next(error);

        }

    };


module.exports = {

    getDashboard

};