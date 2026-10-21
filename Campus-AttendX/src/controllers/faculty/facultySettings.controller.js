const facultySettingsService =
    require("../../services/facultySettings.service");


// =====================================================
// GET MY PROFILE
// =====================================================

const getMyProfile = async (req, res, next) => {

    try {

        const profile =
            await facultySettingsService.getMyProfile(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: "Faculty profile fetched successfully",
            data: profile
        });

    } catch (error) {

        next(error);

    }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async (req, res, next) => {

    try {

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body || {};


        const token =
            req.cookies?.token ||
            (
                req.headers.authorization?.startsWith("Bearer ")
                    ? req.headers.authorization.split(" ")[1]
                    : null
            );


        await facultySettingsService.changePassword({

            facultyId: req.user.id,

            currentPassword,

            newPassword,

            confirmPassword,

            currentToken: token

        });


        // -----------------------------------------
        // CLEAR OLD AUTH COOKIE
        // -----------------------------------------

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });


        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully. Please login again.",
            requireLogin: true
        });

    } catch (error) {

        next(error);

    }
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res, next) => {

    try {

        const token =
            req.cookies?.token ||
            (
                req.headers.authorization?.startsWith("Bearer ")
                    ? req.headers.authorization.split(" ")[1]
                    : null
            );


        if (token) {

            await facultySettingsService.logout(
                token
            );

        }


        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });


        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });


        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
};


module.exports = {
    getMyProfile,
    changePassword,
    logout
};