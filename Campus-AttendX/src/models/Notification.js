const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: { type: String, required: true, trim: true, maxlength: 150 },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        type: {
            type: String,
            enum: [
                "attendance",
                "subject",
                "announcement",
                "grievance",
                "system",
                "general"
            ],
            default: "general",
            required: true
        },
        priority: {
            type: String,
            enum: ["low", "normal", "high", "urgent"],
            default: "normal"
        },
        isRead: { type: Boolean, default: false, index: true },
        readAt: { type: Date, default: null },
        actionUrl: { type: String, default: null, trim: true, maxlength: 500 },
        relatedId: { type: Schema.Types.ObjectId, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);