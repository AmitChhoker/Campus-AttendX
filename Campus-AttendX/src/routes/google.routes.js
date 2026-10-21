const express = require("express");

const router = express.Router();

const {
    getAuthorizationUrl,
    getTokensFromCode
} = require("../config/googleDrive");


// Start Google authorization
router.get("/auth", (req, res) => {

    const authUrl = getAuthorizationUrl();

    res.redirect(authUrl);
});


// Google sends the user back here
router.get("/callback", async (req, res) => {

    try {

        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Authorization code missing"
            });
        }

        await getTokensFromCode(code);

        return res.status(200).send(
            "Google Drive authorization successful!"
        );

    } catch (error) {

        console.error(
            "Google OAuth Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Google Drive authorization failed"
        });
    }
});

module.exports = router;