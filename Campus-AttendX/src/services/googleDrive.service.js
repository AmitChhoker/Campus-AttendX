const fs = require("fs");
const { getGoogleDrive } = require("../config/googleDrive");

// 🔥 Aapke naye folder ki ID
const TARGET_FOLDER_ID = "11tuFIcl1vNkR250oTIMb-TniuB0fFHhH";

const uploadToGoogleDrive = async (file) => {
    if (!file) {
        throw new Error("File is required");
    }

    const drive = getGoogleDrive();

    // 🔥 Purana folder dhoondhne ka logic hata diya hai
    // Ab directly aapke diye hue folder mein upload hoga

    // Upload PDF to the target folder
    const response = await drive.files.create({
        requestBody: {
            name: file.originalname,
            parents: [TARGET_FOLDER_ID] // 👈 Yahan naya folder use ho raha hai
        },
        media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path)
        },
        fields: "id, name, webViewLink"
    });

    // Delete temporary local file
    await fs.promises.unlink(file.path);

    return {
        fileId: response.data.id,
        fileName: response.data.name,
        fileUrl: response.data.webViewLink
    };
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

module.exports = {
    uploadToGoogleDrive,
    deleteFromGoogleDrive
};