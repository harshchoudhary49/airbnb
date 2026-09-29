// External Module
const express = require('express');
const authRouter = express.Router();

// Local Module
const authController = require('../controllers/auth-controller');

authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authController.postLogin);
authRouter.get('/signup', authController.getSignup);
authRouter.post('/signup', authController.postSignup);
authRouter.post('/logout', authController.postLogout);

module.exports = authRouter;
