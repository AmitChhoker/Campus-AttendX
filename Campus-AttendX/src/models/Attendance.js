const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendanceSchema = new Schema(
    {
        session: {
            type: Schema.Types.ObjectId,
            ref: "AttendanceSession",
            required: true,
            index: true
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        markedAt: { type: Date, default: Date.now, required: true },
        status: {
            type: String,
            enum: ["present"],
            default: "present"
        },
        verification: {
            qrVerified: { type: Boolean, default: false },
            bleVerified: { type: Boolean, default: false },
            bleRssi: { type: Number, default: null },
            deviceVerified: { type: Boolean, default: false },
            deviceId: { type: String, default: null },
            fingerprintVerified: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);