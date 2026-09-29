const Home = require("../models/home");

exports.getAddHome = (req, res, next) => {
  res.render('host/addHome', {
    pageTitle: 'Add Home to airbnb',
    editing: false,
    home: {}
  });
};

exports.getHostHomes = (req, res, next) => {
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';
  Home.findByHostId(currentHostId, (registeredHomes) => {
    res.render('host/host-home-list', {
      registeredHomes: registeredHomes,
      pageTitle: 'Host Homes List'
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, photoUrl, description } = req.body;
  const hostId = req.session.user ? req.session.user.id : 'user_host_1';
  const home = new Home(
    houseName,
    price,
    location,
    'New', // Newly listed property defaults to 'New' until guests leave reviews
    photoUrl,
    description,
    hostId
  );
  home.save((err) => {
    if (err) {
      console.error('Error saving home:', err);
    }
    res.render('host/homeAdded', { pageTitle: 'Home Added Successfully' });
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/host/host-home-list');
    }
    // Verify property ownership
    if ((home.hostId || 'user_host_1') !== currentHostId) {
      return res.status(403).render('403', {
        pageTitle: 'Forbidden',
        message: 'You can only edit properties that you created.'
      });
    }
    res.render('host/edit-home', {
      pageTitle: 'Edit Listing - ' + home.houseName,
      editing: true,
      home: home
    });
  });
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, photoUrl, description } = req.body;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

  Home.findById(id, (existingHome) => {
    if (!existingHome) {
      return res.redirect('/host/host-home-list');
    }
    // Verify ownership
    if ((existingHome.hostId || 'user_host_1') !== currentHostId) {
      return res.status(403).render('403', {
        pageTitle: 'Forbidden',
        message: 'You can only update properties that you created.'
      });
    }

    const updatedHome = new Home(
      houseName,
      price,
      location,
      existingHome.rating || 'New', // Preserve authentic rating!
      photoUrl,
      description,
      currentHostId,
      id
    );
    updatedHome.save((err) => {
      if (err) {
        console.error('Error updating home:', err);
      }
      res.redirect('/host/host-home-list');
    });
  });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.body.homeId;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

  Home.deleteById(homeId, currentHostId, (err) => {
    if (err) {
      console.error('Error deleting home:', err);
    }
    res.redirect('/host/host-home-list');
  });
};
