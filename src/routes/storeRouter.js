// Core Modules
const path = require('path');

// External Module
const express = require('express');
const storeRouter = express.Router();

// Local Module
const { registeredHomes } = require('../controllers/store-controller.js');
const homesController = require("../controllers/store-controller.js");

storeRouter.get("/", homesController.getIndex);
storeRouter.get("/bookings", homesController.getbooking);
storeRouter.get("/homes", homesController.getHomes);
storeRouter.get("/favorites", homesController.getfavoritelist);
module.exports = storeRouter;