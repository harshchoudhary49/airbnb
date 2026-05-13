// External Module
const express = require('express');
const hostRouter = express.Router();

// Local Module
const hostcontroller = require("../controllers/host-controller");


hostRouter.get("/add-home", hostcontroller.getAddHome);
hostRouter.get("/host-home-list", hostcontroller.getHostHomes); 
hostRouter.post("/add-home", hostcontroller.postAddHome);

module.exports = hostRouter;