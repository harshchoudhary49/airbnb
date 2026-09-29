const Home = require("../models/home");

exports.getAddHome = (req, res, next) => {
  res.render('host/addHome', {
    pageTitle: 'Add Home to airbnb',
    editing: false,
    home: {}
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.fetchAll((registeredHomes) => {
    res.render('host/host-home-list', {
      registeredHomes: registeredHomes,
      pageTitle: 'Host Homes List'
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, photoUrl, description } = req.body;
  const home = new Home(houseName, price, location, rating, photoUrl, description);
  home.save((err) => {
    if (err) {
      console.error('Error saving home:', err);
    }
    res.render('host/homeAdded', { pageTitle: 'Home Added Successfully' });
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/host/host-home-list');
    }
    res.render('host/edit-home', {
      pageTitle: 'Edit Listing - ' + home.houseName,
      editing: true,
      home: home
    });
  });
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, photoUrl, description } = req.body;
  const updatedHome = new Home(houseName, price, location, rating, photoUrl, description, id);
  updatedHome.save((err) => {
    if (err) {
      console.error('Error updating home:', err);
    }
    res.redirect('/host/host-home-list');
  });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.body.homeId;
  Home.deleteById(homeId, (err) => {
    if (err) {
      console.error('Error deleting home:', err);
    }
    res.redirect('/host/host-home-list');
  });
};
