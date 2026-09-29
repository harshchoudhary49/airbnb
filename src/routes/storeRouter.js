// Core Modules
const express = require('express');
const storeRouter = express.Router();

// Local Module
const storeController = require('../controllers/store-controller');

// Browsing & Home Listings
storeRouter.get('/', storeController.getIndex);
storeRouter.get('/homes', storeController.getHomes);
storeRouter.get('/homes/:homeId', storeController.getHomeDetails);

// Reservations & Bookings
storeRouter.get('/reserve/:homeId', storeController.getReserveHome);
storeRouter.post('/reserve', storeController.postReserveHome);
storeRouter.get('/bookings', storeController.getBookings);
storeRouter.post('/cancel-booking', storeController.postCancelBooking);

// Favorites / Wishlist
storeRouter.get('/favorites', storeController.getfavoritelist);
storeRouter.post('/favorites/add', storeController.postAddToFavorites);
storeRouter.post('/favorites/remove', storeController.postRemoveFromFavorites);

module.exports = storeRouter;