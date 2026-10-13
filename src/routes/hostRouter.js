const express = require('express');
const hostRouter = express.Router();

const hostcontroller = require('../controllers/host-controller');
const isHost = require('../middleware/isHost');

// Restrict all routes in this router to hosts
hostRouter.use(isHost);

hostRouter.get('/add-home', hostcontroller.getAddHome);
hostRouter.post('/add-home', hostcontroller.postAddHome);
hostRouter.get('/host-home-list', hostcontroller.getHostHomes);
hostRouter.get('/edit-home/:homeId', hostcontroller.getEditHome);
hostRouter.post('/edit-home', hostcontroller.postEditHome);
hostRouter.post('/delete-home', hostcontroller.postDeleteHome);

// Revenue and earnings shortcuts
hostRouter.get('/revenue', (req, res) => res.redirect('/spend-analyzer?tab=revenue'));
hostRouter.get('/earnings', (req, res) => res.redirect('/spend-analyzer?tab=revenue'));
hostRouter.get('/spend-analyzer', (req, res) => res.redirect('/spend-analyzer?tab=revenue'));

module.exports = hostRouter;