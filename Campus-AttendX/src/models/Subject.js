// src/models/Subject.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema(
    {
        subjectName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        subjectCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        course: {
            type: String,
            required: true,
            enum: ["B.TECH", "BCA", "DIPLOMA"]
        },

        branch: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8
        },

        credits: {
            type: Number,
            required: true,
            min: 0
        },

        type: {
            type: String,
            enum: ["theory", "lab", "elective"],
            required: true
        },

        // Google Drive syllabus info
        syllabus: {
            fileId: { type: String, required: true },
            fileName: { type: String, required: true, trim: true },
            fileUrl: { type: String, required: true }
        },

        // Faculty who submitted the subject
        submittedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Approval workflow
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            trim: true,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

subjectSchema.index({ course: 1, branch: 1, semester: 1 });
subjectSchema.index({ status: 1, createdAt: -1 });

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;