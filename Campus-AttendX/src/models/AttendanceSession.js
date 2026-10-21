const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendanceSessionSchema = new Schema(
    {
        subject: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
            index: true
        },

        faculty: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        sessionCode: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        // Per-session HMAC secret for BLE tokens
        bleSecret: {
            type: String,
            required: false,
            select: false
        },

        startedAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date, required: true },

        status: {
            type: String,
            enum: ["active", "closed", "expired"],
            default: "active",
            index: true
        },

        closedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

attendanceSessionSchema.index({ subject: 1, createdAt: -1 });
attendanceSessionSchema.index({ faculty: 1, createdAt: -1 });

const AttendanceSession = mongoose.model(
    "AttendanceSession",
    attendanceSessionSchema
);

module.exports = AttendanceSession;