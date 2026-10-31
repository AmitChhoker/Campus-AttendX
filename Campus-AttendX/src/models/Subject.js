const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema({
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    course: { type: String, enum: ["B.TECH", "BCA", "DIPLOMA"], required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    
    // Naye Fields
    sessionYear: { type: String, required: true, default: "2024-2028" }, 
    hoursPerClass: { type: Number, required: true, default: 1 },

    credits: { type: Number, required: true },
    type: { type: String, enum: ["theory", "lab", "project"], required: true }, 
    totalPlannedClasses: { type: Number, required: true, default: 40 },
    
    syllabus: { fileId: String, fileName: String, fileUrl: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    // 🔥 YE DO FIELDS MISSING THE (Ab add kar diye hain)
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Subject", subjectSchema);