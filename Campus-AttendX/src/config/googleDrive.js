const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// =====================================================
// AUTO-CREATE FILES FROM ENV VARIABLES (For Render)
// =====================================================
if (!fs.existsSync(CREDENTIALS_PATH) && process.env.GOOGLE_CREDENTIALS_BASE64) {
    fs.writeFileSync(CREDENTIALS_PATH, Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8'));
}
if (!fs.existsSync(TOKEN_PATH) && process.env.GOOGLE_TOKEN_BASE64) {
    fs.writeFileSync(TOKEN_PATH, Buffer.from(process.env.GOOGLE_TOKEN_BASE64, 'base64').toString('utf-8'));
}

const getOAuth2Client = () => {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("credentials.json missing! Please add it to project root or ENV.");
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    const config = credentials.web || credentials.installed;
    
    if (!config) {
        throw new Error("Invalid credentials.json. Missing 'web' or 'installed' key.");
    }

    const { client_id, client_secret } = config;
    
    // Force the redirect URI to hit our backend callback route
    const redirect_uri = process.env.NODE_ENV === "production" 
        ? "https://campus-attendx-backend.onrender.com/api/google/callback" // Apna Render URL yahan daalein
        : "http://localhost:4000/api/google/callback";

    return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
};

const getAuthorizationUrl = () => {
    return getOAuth2Client().generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
};

const getTokensFromCode = async (code) => {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    return tokens;
};

const getGoogleDrive = () => {
    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error("Google Drive is not authorized yet. Visit /api/google/auth first.");
    }
    const oauth2Client = getOAuth2Client();
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oauth2Client.setCredentials(tokens);
    
    return google.drive({ version: "v3", auth: oauth2Client });
};

module.exports = { getAuthorizationUrl, getTokensFromCode, getGoogleDrive };