const fs = require("fs");
const { getGoogleDrive } = require("../config/googleDrive");

const uploadToGoogleDrive = async (file) => {
    if (!file) throw new Error("File is required");

    const drive = getGoogleDrive();

    // 1. Create/Find main folder
    let mainFolderId;
    const mainFolderRes = await drive.files.list({
        q: "name = 'SVSU Attendance' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: "files(id, name)"
    });

    if (mainFolderRes.data.files.length > 0) {
        mainFolderId = mainFolderRes.data.files[0].id;
    } else {
        const folder = await drive.files.create({
            requestBody: { name: "SVSU Attendance", mimeType: "application/vnd.google-apps.folder" },
            fields: "id"
        });
        mainFolderId = folder.data.id;
    }

    // 2. Upload file
    try {
        const response = await drive.files.create({
            requestBody: { name: file.originalname, parents: [mainFolderId] },
            media: { mimeType: file.mimetype, body: fs.createReadStream(file.path) },
            fields: "id, name, webViewLink"
        });

        // Delete temp file
        fs.unlinkSync(file.path);

        return {
            fileId: response.data.id,
            fileName: response.data.name,
            fileUrl: response.data.webViewLink
        };
    } catch (error) {
        console.error("Drive Upload Error:", error.message);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new Error("Failed to upload to Google Drive. Check token.");
    }
};

const deleteFromGoogleDrive = async (fileId) => {
    if (!fileId) return;
    try {
        const drive = getGoogleDrive();
        await drive.files.delete({ fileId });
    } catch (error) {
        console.log("Drive Delete Error:", error.message);
    }
};

module.exports = { uploadToGoogleDrive, deleteFromGoogleDrive };