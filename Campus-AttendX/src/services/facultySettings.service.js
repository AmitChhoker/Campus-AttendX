// src/services/facultySettings.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const redisClient = require("../config/redis");

// =====================================================
// GET MY PROFILE
// =====================================================

const getMyProfile = async (facultyId) => {
    const faculty = await User.findOne({
        _id: facultyId,
        role: "faculty"
    }).select("-password");

    if (!faculty) {
        throw new Error("Faculty profile not found");
    }

    return faculty;
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async ({
    facultyId,
    currentPassword,
    newPassword,
    confirmPassword,
    currentToken
}) => {
    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------
    if (!currentPassword) {
        throw new Error("Current password is required");
    }
    if (!newPassword) {
        throw new Error("New password is required");
    }
    if (!confirmPassword) {
        throw new Error("Confirm password is required");
    }
    if (newPassword !== confirmPassword) {
        throw new Error(
            "New password and confirm password do not match"
        );
    }
    if (newPassword.length < 8) {
        throw new Error(
            "New password must be at least 8 characters long"
        );
    }

    // ---------------------------------------------
    // FIND FACULTY
    // ---------------------------------------------
    const faculty = await User.findOne({
        _id: facultyId,
        role: "faculty"
    });

    if (!faculty) {
        throw new Error("Faculty not found");
    }

    // ---------------------------------------------
    // VERIFY CURRENT PASSWORD
    // ---------------------------------------------
    const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        faculty.password
    );

    if (!isPasswordCorrect) {
        throw new Error("Current password is incorrect");
    }

    // ---------------------------------------------
    // PREVENT SAME PASSWORD
    // ---------------------------------------------
    const isSamePassword = await bcrypt.compare(
        newPassword,
        faculty.password
    );

    if (isSamePassword) {
        throw new Error(
            "New password must be different from current password"
        );
    }

    // ---------------------------------------------
    // SAVE NEW HASHED PASSWORD
    // ---------------------------------------------
    faculty.password = await bcrypt.hash(newPassword, 12);
    await faculty.save();

    // ---------------------------------------------
    // INVALIDATE CURRENT JWT
    // ---------------------------------------------
    if (currentToken) {
        try {
            const decoded = jwt.verify(
                currentToken,
                process.env.JWT_SECRET_KEY
            );

            const nowSec = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - nowSec;

            if (remaining > 0) {
                await redisClient.set(
                    `blacklist:${currentToken}`,
                    "true",
                    { EX: remaining }
                );
            }
        } catch {
            // token already invalid — nothing to do
        }
    }

    return true;
};

// =====================================================
// LOGOUT
// =====================================================

const logout = async (token) => {
    if (!token) {
        throw new Error("Authentication token not found");
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const nowSec = Math.floor(Date.now() / 1000);
        const remaining = decoded.exp - nowSec;

        if (remaining > 0) {
            await redisClient.set(
                `blacklist:${token}`,
                "true",
                { EX: remaining }
            );
        }
    } catch {
        // token already invalid
    }

    return true;
};

module.exports = {
    getMyProfile,
    changePassword,
    logout
};