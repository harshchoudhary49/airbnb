// External Module
const express = require('express');
const rateLimit = require('express-rate-limit');
const authRouter = express.Router();

// Local Module
const authController = require('../controllers/auth-controller');

// Stricter rate limiter for authentication routes (prevent credential stuffing / brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
});

authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authLimiter, authController.postLogin);
authRouter.get('/signup', authController.getSignup);
authRouter.post('/signup', authLimiter, authController.postSignup);
authRouter.post('/logout', authController.postLogout);

module.exports = authRouter;
