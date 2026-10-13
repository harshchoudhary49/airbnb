// Core Modules
const express = require('express');
const rateLimit = require('express-rate-limit');
const storeRouter = express.Router();

// Local Module
const storeController = require('../controllers/store-controller');
const isAuth = require('../middleware/isAuth');

// Stricter rate limiters for transaction endpoints
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many reservation attempts from this IP. Please wait a few minutes before trying again.'
});

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many review submissions from this IP. Please wait a few minutes before trying again.'
});

// Public Browsing Endpoints
storeRouter.get('/', storeController.getIndex);
storeRouter.get('/homes', storeController.getHomes);
storeRouter.get('/homes/:homeId', storeController.getHomeDetails);

// Protected Reservations & Bookings (Requires login)
storeRouter.get('/reserve/:homeId', isAuth, storeController.getReserveHome);
storeRouter.post('/reserve', isAuth, bookingLimiter, storeController.postReserveHome);
storeRouter.get('/bookings', isAuth, storeController.getBookings);
storeRouter.post('/cancel-booking', isAuth, storeController.postCancelBooking);

// Protected Spend Analyzer & Analytics (Requires login)
storeRouter.get('/spend-analyzer', isAuth, storeController.getSpendAnalyzer);
storeRouter.get('/spend-analyzer/export', isAuth, storeController.getSpendExport);
storeRouter.get('/revenue', isAuth, (req, res) => res.redirect('/spend-analyzer?tab=revenue'));
storeRouter.get('/earnings', isAuth, (req, res) => res.redirect('/spend-analyzer?tab=revenue'));

// Protected Favorites / Wishlist (Requires login)
storeRouter.get('/favorites', isAuth, storeController.getfavoritelist);
storeRouter.post('/favorites/add', isAuth, storeController.postAddToFavorites);
storeRouter.post('/favorites/remove', isAuth, storeController.postRemoveFromFavorites);

// Protected Reviews & Ratings (Requires login)
storeRouter.post('/homes/:homeId/reviews', isAuth, reviewLimiter, storeController.postAddReview);
storeRouter.post('/reviews/:reviewId/delete', isAuth, storeController.postDeleteReview);

module.exports = storeRouter;