const express = require('express');
const authentication = require('../middleware/authMiddleware'); // Apne path ke hisaab se check kar lein
const { 
    register, 
    login, 
    logout, 
    me, 
    refreshToken, 
    changePassword,
    sendOtp, 
    resetPasswordWithOtp 
} = require('../controllers/auth.controller');

const authRouter = express.Router();

// Yahan /auth nahi hoga, sirf direct route hoga
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authentication, me);
authRouter.post('/refresh', refreshToken);
authRouter.patch('/change-password', authentication, changePassword);

// OTP Routes
authRouter.post('/send-otp', sendOtp);
authRouter.post('/reset-password', resetPasswordWithOtp);

module.exports = authRouter;