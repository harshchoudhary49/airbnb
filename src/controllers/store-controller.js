const Home = require("../models/home");


exports.getHomes = (req, res, next) => {
  Home.fetchAll((registeredHomes) => res.render('store/home-list', 
  {registeredHomes: registeredHomes, pageTitle: 'homeslist'}));
  
};

exports.getIndex = (req, res, next) => {
  Home.fetchAll((registeredHomes) => res.render('store/index-list',
  {registeredHomes: registeredHomes, pageTitle: 'airbnb Home'}));
  
};
exports.getbooking =  (req, res, next) => {
  res.render('store/booking', 
  { pageTitle: 'my bookings'});
  
};

exports.getfavoritelist = (req, res, next) => {
  Home.fetchAll((registeredHomes) => res.render('store/favorite-list', 
  {registeredHomes: registeredHomes, pageTitle: 'my favorites'}));
  
};