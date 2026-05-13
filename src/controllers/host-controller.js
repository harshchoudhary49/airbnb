const Home = require("../models/home");

exports.getAddHome = (req, res, next) => {
  res.render('host/addHome', {pageTitle: 'Add Home to airbnb'});
};

exports.getHostHomes = (req, res, next) => {
  Home.fetchAll((registeredHomes) => res.render('host/host-home-list', 
  {registeredHomes: registeredHomes, pageTitle: 'hosthomeslist'}));
  
};

exports.postAddHome = (req, res, next) => {
  console.log('Home Registration successful for:', req.body);
  const {houseName, price, location, rating, photoUrl} = req.body;
  const home = new Home(houseName, price, location, rating, photoUrl);
  home.save();


  res.render('host/homeAdded', {pageTitle: 'Home Added Successfully'});
};
