const express = require('express');
const authentication = require('../middleware/authMiddleware');
const {register, login, logout, me, refreshToken,changePassword} = require('../controllers/auth.controller');
const authRouter = express.Router();

//Register
authRouter.post('/auth/register',register);
//login
authRouter.post("/auth/login",login);
//logout
authRouter.post('/auth/logout', logout);
//me
authRouter.get("/auth/me",authentication,me);
//refresh
authRouter.post("/auth/refresh",refreshToken);
//change-password..
authRouter.patch("/auth/change-password",authentication,changePassword);

module.exports  = authRouter;   