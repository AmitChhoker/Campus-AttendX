const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema({
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    course: { type: String, enum: ["B.TECH", "BCA", "DIPLOMA"], required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    
    // 🔥 NAYE FIELDS
    sessionYear: { type: String, required: true, default: "2024-2028" }, 
    hoursPerClass: { type: Number, required: true, default: 1 }, // 1, 2, or 3

    credits: { type: Number, required: true },
    type: { type: String, enum: ["theory", "lab", "project"], required: true }, // Added Project
    totalPlannedClasses: { type: Number, required: true, default: 40 },
    
    syllabus: { fileId: String, fileName: String, fileUrl: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Subject", subjectSchema);