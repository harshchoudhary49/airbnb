// Core Modules
const express = require('express');
const storeRouter = express.Router();

// Local Module
const storeController = require('../controllers/store-controller');
const isAuth = require('../middleware/isAuth');

// Public Browsing Endpoints
storeRouter.get('/', storeController.getIndex);
storeRouter.get('/homes', storeController.getHomes);
storeRouter.get('/homes/:homeId', storeController.getHomeDetails);

// Protected Reservations & Bookings (Requires login)
storeRouter.get('/reserve/:homeId', isAuth, storeController.getReserveHome);
storeRouter.post('/reserve', isAuth, storeController.postReserveHome);
storeRouter.get('/bookings', isAuth, storeController.getBookings);
storeRouter.post('/cancel-booking', isAuth, storeController.postCancelBooking);

// Protected Favorites / Wishlist (Requires login)
storeRouter.get('/favorites', isAuth, storeController.getfavoritelist);
storeRouter.post('/favorites/add', isAuth, storeController.postAddToFavorites);
storeRouter.post('/favorites/remove', isAuth, storeController.postRemoveFromFavorites);

module.exports = storeRouter;